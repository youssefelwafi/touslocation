<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Marque;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarqueController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $query = Marque::withCount('materiels')->orderBy('nom');
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

        return response()->json(Marque::create($data), 201);
    }

    public function update(Request $request, Marque $marque): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $marque);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $marque->update($data);

        return response()->json($marque);
    }

    public function destroy(Request $request, Marque $marque): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $marque);
        abort_if($marque->materiels()->exists(), 422, 'Marque utilisée par du matériel : suppression impossible.');

        $marque->delete();

        return response()->json(['message' => 'Marque supprimée']);
    }
}
