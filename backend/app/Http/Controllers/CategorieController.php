<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Categorie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $query = Categorie::withCount('materiels')->orderBy('nom');
        $rows = $this->scopeToTenant($query, $request)->get();

        return response()->json($this->dedupeForSuperAdmin($request, $rows, 'nom'));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "parametres");

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $data['proprietaire_id'] = $this->ownerId($request);

        return response()->json(Categorie::create($data), 201);
    }

    public function update(Request $request, Categorie $categorie): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $categorie);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $categorie->update($data);

        return response()->json($categorie);
    }

    public function destroy(Request $request, Categorie $categorie): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $categorie);
        abort_if($categorie->materiels()->exists(), 422, 'Catégorie utilisée par du matériel : suppression impossible.');

        $categorie->delete();

        return response()->json(['message' => 'Catégorie supprimée']);
    }
}
