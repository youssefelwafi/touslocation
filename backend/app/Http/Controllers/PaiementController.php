<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Paiement;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    use TenantScoped;

    // Liste des paiements d'une location.
    public function index(Request $request, Location $location): JsonResponse
    {
        $this->authorizeView($request, $location);

        return response()->json($location->paiements()->with(['utilisateur', 'typePaiement'])->latest('date_paiement')->get());
    }

    // Enregistre un paiement (partiel ou total).
    public function store(Request $request, Location $location): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);
        $this->ensureOwned($request, $location);

        $data = $request->validate([
            'montant' => ['required', 'numeric', 'min:0.01'],
            'type_paiement_id' => ['required', 'exists:types_paiement,id'],
            'date_paiement' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
        ], [
            'type_paiement_id.required' => 'Le type de paiement est requis.',
        ]);

        // On empêche de dépasser le reste à payer.
        if ($data['montant'] > $location->montant_restant + 0.001) {
            abort(422, "Le montant dépasse le reste à payer ({$location->montant_restant}).");
        }

        $paiement = $location->paiements()->create([
            'utilisateur_id' => $request->user()->id,
            'type_paiement_id' => $data['type_paiement_id'],
            'montant' => $data['montant'],
            'date_paiement' => $data['date_paiement'] ?? now()->toDateString(),
            'note' => $data['note'] ?? null,
        ]);

        return response()->json([
            'payment' => $paiement->load(['utilisateur', 'typePaiement']),
            'rental' => $location->fresh(),
        ], 201);
    }

    public function destroy(Request $request, Paiement $paiement): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);
        $this->ensureOwned($request, $paiement->location);
        $paiement->delete();

        return response()->json(['message' => 'Paiement supprimé']);
    }

    private function authorizeView(Request $request, Location $location): void
    {
        abort_unless(
            $request->user()->isStaff() || $request->user()->id === $location->utilisateur_id,
            403
        );
        if ($request->user()->isStaff()) {
            $this->ensureOwned($request, $location);
        }
    }
}
