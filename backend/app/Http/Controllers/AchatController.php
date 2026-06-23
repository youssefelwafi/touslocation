<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Materiel;
use App\Models\Achat;
use App\Models\PaiementAchat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AchatController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $this->requireModule($request, "achats");
        $query = Achat::with(['fournisseur', 'lignes.materiel', 'paiements.typePaiement'])->latest();

        return response()->json($this->scopeToTenant($query, $request)->paginate(15));
    }

    // Modification d'un achat. Les articles ne sont modifiables que tant qu'il
    // est "en attente" (pour ne pas désynchroniser le stock déjà alimenté).
    public function update(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, 'achats');
        $this->ensureOwned($request, $achat);

        $data = $request->validate([
            'fournisseur_id' => ['nullable', 'exists:fournisseurs,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'date_achat' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.materiel_id' => ['required_with:items', 'exists:materiels,id'],
            'items.*.quantite' => ['required_with:items', 'integer', 'min:1'],
            'items.*.cout_unitaire' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($achat, $data, $request) {
            $achat->update([
                'fournisseur_id' => $data['fournisseur_id'] ?? null,
                'reference' => $data['reference'] ?? null,
                'date_achat' => $data['date_achat'],
                'note' => $data['note'] ?? null,
            ]);

            if (! empty($data['items'])) {
                abort_if($achat->statut === 'received', 422, 'Achat réceptionné : les articles ne sont plus modifiables.');
                $achat->lignes()->delete();
                $total = 0;
                foreach ($data['items'] as $item) {
                    $eq = Materiel::findOrFail($item['materiel_id']);
                    $this->ensureOwned($request, $eq);
                    $sub = $item['cout_unitaire'] * $item['quantite'];
                    $total += $sub;
                    $achat->lignes()->create([
                        'materiel_id' => $eq->id, 'quantite' => $item['quantite'],
                        'cout_unitaire' => $item['cout_unitaire'], 'sous_total' => $sub,
                    ]);
                }
                $achat->update(['montant_total' => $total]);
            }
        });

        return response()->json($achat->fresh()->load(['fournisseur', 'lignes.materiel', 'paiements.typePaiement']));
    }

    // --- Paiements fournisseur ---
    public function payments(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, 'achats');
        $this->ensureOwned($request, $achat);

        return response()->json($achat->paiements()->with('typePaiement')->latest('date_paiement')->get());
    }

    public function storePayment(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, 'achats');
        $this->ensureOwned($request, $achat);

        $data = $request->validate([
            'montant' => ['required', 'numeric', 'min:0.01'],
            'type_paiement_id' => ['required', 'exists:types_paiement,id'],
            'date_paiement' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
        abort_if($data['montant'] > $achat->montant_restant + 0.001, 422, "Le montant dépasse le reste à payer ({$achat->montant_restant}).");

        $paiement = $achat->paiements()->create([
            'utilisateur_id' => $request->user()->id,
            'type_paiement_id' => $data['type_paiement_id'],
            'montant' => $data['montant'],
            'date_paiement' => $data['date_paiement'] ?? now()->toDateString(),
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['payment' => $paiement->load('typePaiement'), 'purchase' => $achat->fresh()], 201);
    }

    public function destroyPayment(Request $request, PaiementAchat $paiement): JsonResponse
    {
        $this->requireModule($request, 'achats');
        $this->ensureOwned($request, $paiement->achat);
        $paiement->delete();

        return response()->json(['message' => 'Paiement supprimé']);
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "achats");

        $data = $request->validate([
            'fournisseur_id' => ['nullable', 'exists:fournisseurs,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'date_achat' => ['required', 'date'],
            'statut' => ['required', 'in:pending,received'],
            'note' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.materiel_id' => ['required', 'exists:materiels,id'],
            'items.*.quantite' => ['required', 'integer', 'min:1'],
            'items.*.cout_unitaire' => ['required', 'numeric', 'min:0'],
        ]);

        $achat = DB::transaction(function () use ($data, $request) {
            $achat = Achat::create([
                'proprietaire_id' => $this->ownerId($request),
                'fournisseur_id' => $data['fournisseur_id'] ?? null,
                'utilisateur_id' => $request->user()->id,
                'reference' => $data['reference'] ?? null,
                'date_achat' => $data['date_achat'],
                'statut' => $data['statut'],
                'note' => $data['note'] ?? null,
                'montant_total' => 0,
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
                $materiel = Materiel::findOrFail($item['materiel_id']);
                $this->ensureOwned($request, $materiel);

                $subtotal = $item['cout_unitaire'] * $item['quantite'];
                $total += $subtotal;

                $achat->lignes()->create([
                    'materiel_id' => $materiel->id,
                    'quantite' => $item['quantite'],
                    'cout_unitaire' => $item['cout_unitaire'],
                    'sous_total' => $subtotal,
                ]);

                // Réception => on alimente l'inventaire.
                if ($data['statut'] === 'received') {
                    $materiel->increment('quantite', $item['quantite']);
                }
            }

            $achat->update(['montant_total' => $total]);

            return $achat;
        });

        return response()->json($achat->load(['fournisseur', 'lignes.materiel']), 201);
    }

    public function show(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, "achats");
        $this->ensureOwned($request, $achat);

        return response()->json($achat->load(['fournisseur', 'lignes.materiel']));
    }

    public function destroy(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, "achats");
        $this->ensureOwned($request, $achat);

        DB::transaction(function () use ($achat) {
            // Si réceptionné, on retire du stock ce qui avait été ajouté.
            if ($achat->statut === 'received') {
                foreach ($achat->lignes as $item) {
                    Materiel::where('id', $item->materiel_id)->decrement('quantite', $item->quantite);
                }
            }
            $achat->delete();
        });

        return response()->json(['message' => 'Achat supprimé']);
    }

    // Réceptionne une commande en attente : alimente l'inventaire.
    public function receive(Request $request, Achat $achat): JsonResponse
    {
        $this->requireModule($request, "achats");
        $this->ensureOwned($request, $achat);
        abort_if($achat->statut === 'received', 422, 'Achat déjà réceptionné.');

        DB::transaction(function () use ($achat) {
            foreach ($achat->lignes as $item) {
                Materiel::where('id', $item->materiel_id)->increment('quantite', $item->quantite);
            }
            $achat->update(['statut' => 'received']);
        });

        return response()->json($achat->fresh()->load(['fournisseur', 'lignes.materiel']));
    }
}
