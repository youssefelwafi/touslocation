<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepenseController extends Controller
{
    use TenantScoped;

    private function rules(): array
    {
        return [
            'categorie' => ['required', 'string', 'max:100'],
            'libelle' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'numeric', 'min:0'],
            'date_depense' => ['required', 'date'],
            'fournisseur_id' => ['nullable', 'exists:fournisseurs,id'],
            'type_paiement_id' => ['nullable', 'exists:types_paiement,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $this->requireModule($request, "depenses");
        $query = Depense::with(['fournisseur', 'typePaiement'])->latest('date_depense');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")->orWhere('categorie', 'like', "%{$search}%");
            });
        }

        return response()->json($this->scopeToTenant($query, $request)->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "depenses");

        $data = $request->validate($this->rules());
        $data['proprietaire_id'] = $this->ownerId($request);
        $data['utilisateur_id'] = $request->user()->id;

        return response()->json(Depense::create($data)->load(['fournisseur', 'typePaiement']), 201);
    }

    public function update(Request $request, Depense $depense): JsonResponse
    {
        $this->requireModule($request, "depenses");
        $this->ensureOwned($request, $depense);

        $depense->update($request->validate($this->rules()));

        return response()->json($depense->load(['fournisseur', 'typePaiement']));
    }

    public function destroy(Request $request, Depense $depense): JsonResponse
    {
        $this->requireModule($request, "depenses");
        $this->ensureOwned($request, $depense);
        $depense->delete();

        return response()->json(['message' => 'Dépense supprimée']);
    }
}
