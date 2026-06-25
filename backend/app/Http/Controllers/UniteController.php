<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Unite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UniteController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        $query = Unite::withCount('materiels')->orderBy('nom');
        $rows = $this->scopeToTenant($query, $request)->get();

        return response()->json($this->dedupeForSuperAdmin($request, $rows, 'nom'));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, "parametres");

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'symbole' => ['required', 'string', 'max:16'],
        ]);
        $data['proprietaire_id'] = $this->ownerId($request);

        return response()->json(Unite::create($data), 201);
    }

    public function update(Request $request, Unite $unite): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $unite);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'symbole' => ['sometimes', 'string', 'max:16'],
        ]);

        $unite->update($data);

        return response()->json($unite->fresh());
    }

    public function destroy(Request $request, Unite $unite): JsonResponse
    {
        $this->requireModule($request, "parametres");
        $this->ensureOwned($request, $unite);
        abort_if($unite->materiels()->exists(), 422, 'Unité utilisée par du matériel : suppression impossible.');

        $unite->delete();

        return response()->json(['message' => 'Unité supprimée']);
    }
}
