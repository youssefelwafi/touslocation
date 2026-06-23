<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Materiel;
use App\Models\Vente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VenteController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $this->requireModule($request, "ventes");
        $query = Vente::with(['client', 'lignes.materiel'])->latest();

        return response()->json($this->scopeToTenant($query, $request)->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "ventes");

        $data = $request->validate([
            'client_id' => ['nullable', 'exists:utilisateurs,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'date_vente' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.materiel_id' => ['required', 'exists:materiels,id'],
            'items.*.quantite' => ['required', 'integer', 'min:1'],
            'items.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
        ]);

        $taxRate = \App\Models\Taxe::defaultRateFor($this->ownerId($request));

        $vente = DB::transaction(function () use ($data, $request, $taxRate) {
            $vente = Vente::create([
                'proprietaire_id' => $this->ownerId($request),
                'client_id' => $data['client_id'] ?? null,
                'utilisateur_id' => $request->user()->id,
                'reference' => $data['reference'] ?? null,
                'date_vente' => $data['date_vente'],
                'taux_taxe' => $taxRate,
                'note' => $data['note'] ?? null,
            ]);

            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $materiel = Materiel::lockForUpdate()->findOrFail($item['materiel_id']);
                $this->ensureOwned($request, $materiel);

                // La vente retire définitivement du stock.
                abort_if($materiel->quantite < $item['quantite'], 422, "Stock insuffisant pour « {$materiel->nom} » (dispo : {$materiel->quantite}).");

                $line = $item['prix_unitaire'] * $item['quantite'];
                $subtotal += $line;

                $vente->lignes()->create([
                    'materiel_id' => $materiel->id,
                    'quantite' => $item['quantite'],
                    'prix_unitaire' => $item['prix_unitaire'],
                    'sous_total' => $line,
                ]);

                $materiel->decrement('quantite', $item['quantite']);
            }

            $tax = round($subtotal * $taxRate / 100, 2);
            $vente->update([
                'sous_total' => $subtotal,
                'montant_taxe' => $tax,
                'montant_total' => $subtotal + $tax,
            ]);

            return $vente;
        });

        return response()->json($vente->load(['client', 'lignes.materiel']), 201);
    }

    public function show(Request $request, Vente $vente): JsonResponse
    {
        $this->requireModule($request, "ventes");
        $this->ensureOwned($request, $vente);

        return response()->json($vente->load(['client', 'lignes.materiel']));
    }

    public function destroy(Request $request, Vente $vente): JsonResponse
    {
        $this->requireModule($request, "ventes");
        $this->ensureOwned($request, $vente);

        DB::transaction(function () use ($vente) {
            // Annulation de vente : on restitue le stock vendu.
            foreach ($vente->lignes as $item) {
                Materiel::where('id', $item->materiel_id)->increment('quantite', $item->quantite);
            }
            $vente->delete();
        });

        return response()->json(['message' => 'Vente supprimée']);
    }
}
