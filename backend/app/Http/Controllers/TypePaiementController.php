<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\TypePaiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TypePaiementController extends Controller
{
    use TenantScoped;

    // Liste : tous (du tenant) pour le staff, uniquement les actifs sinon.
    public function index(Request $request): JsonResponse
    {
        $query = TypePaiement::withCount('paiements')->orderBy('nom');
        $this->scopeToTenant($query, $request);
        if (! $request->user()->isStaff()) {
            $query->where('actif', true);
        }

        return response()->json($this->dedupeForSuperAdmin($request, $query->get(), 'nom'));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "parametres");

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'actif' => ['boolean'],
        ]);
        $data['proprietaire_id'] = $this->ownerId($request);

        return response()->json(TypePaiement::create($data), 201);
    }

    public function update(Request $request, TypePaiement $typePaiement): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $typePaiement);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'actif' => ['boolean'],
        ]);

        $typePaiement->update($data);

        return response()->json($typePaiement);
    }

    public function destroy(Request $request, TypePaiement $typePaiement): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $typePaiement);
        abort_if($typePaiement->paiements()->exists(), 422, 'Type utilisé par des paiements : suppression impossible.');

        $typePaiement->delete();

        return response()->json(['message' => 'Type de paiement supprimé']);
    }
}
