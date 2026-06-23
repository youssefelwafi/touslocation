<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Materiel;
use App\Models\LigneAchat;
use App\Models\AjustementStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AjustementController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $this->requireModule($request, "ajustements");
        $query = AjustementStock::with(['materiel', 'utilisateur'])->latest();

        if ($equipmentId = $request->query('materiel_id')) {
            $query->where('materiel_id', $equipmentId);
        }

        return response()->json($this->scopeToTenant($query, $request)->paginate(20));
    }

    // Ajustement manuel d'inventaire (entrée/sortie) avec motif.
    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "ajustements");

        $data = $request->validate([
            'materiel_id' => ['required', 'exists:materiels,id'],
            'type' => ['required', 'in:in,out'],
            'quantite' => ['required', 'integer', 'min:1'],
            'valeur_unitaire' => ['nullable', 'numeric', 'min:0'],
            'motif' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $adjustment = DB::transaction(function () use ($data, $request) {
            $materiel = Materiel::lockForUpdate()->findOrFail($data['materiel_id']);
            $this->ensureOwned($request, $materiel);

            $before = $materiel->quantite;
            $delta = $data['type'] === 'in' ? $data['quantite'] : -$data['quantite'];
            $after = $before + $delta;

            abort_if($after < 0, 422, "Stock insuffisant : disponible {$before}, sortie demandée {$data['quantite']}.");

            // Valeur unitaire : saisie, sinon dernier prix d'achat connu (placeholder).
            $unitValue = $data['valeur_unitaire'] ?? LigneAchat::where('materiel_id', $materiel->id)
                ->latest('id')->value('cout_unitaire');
            $totalValue = $unitValue !== null ? round($unitValue * $data['quantite'], 2) : null;

            $materiel->update(['quantite' => $after]);

            return AjustementStock::create([
                'proprietaire_id' => $this->ownerId($request),
                'materiel_id' => $materiel->id,
                'utilisateur_id' => $request->user()->id,
                'type' => $data['type'],
                'quantite' => $data['quantite'],
                'quantite_avant' => $before,
                'quantite_apres' => $after,
                'valeur_unitaire' => $unitValue,
                'valeur_totale' => $totalValue,
                'motif' => $data['motif'],
                'note' => $data['note'] ?? null,
            ]);
        });

        return response()->json($adjustment->load(['materiel', 'utilisateur']), 201);
    }
}
