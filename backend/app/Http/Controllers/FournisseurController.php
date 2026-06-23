<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Fournisseur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FournisseurController extends Controller
{
    use TenantScoped;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);
        $query = Fournisseur::withCount('achats')->orderBy('nom');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        return response()->json($this->scopeToTenant($query, $request)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, 'fournisseurs');

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
        ]);
        $data['proprietaire_id'] = $this->ownerId($request);

        return response()->json(Fournisseur::create($data), 201);
    }

    public function update(Request $request, Fournisseur $fournisseur): JsonResponse
    {
        $this->requireModule($request, 'fournisseurs');
        $this->ensureOwned($request, $fournisseur);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
        ]);

        $fournisseur->update($data);

        return response()->json($fournisseur);
    }

    public function destroy(Request $request, Fournisseur $fournisseur): JsonResponse
    {
        $this->requireModule($request, 'fournisseurs');
        $this->ensureOwned($request, $fournisseur);
        abort_if($fournisseur->achats()->exists(), 422, 'Fournisseur lié à des achats : suppression impossible.');

        $fournisseur->delete();

        return response()->json(['message' => 'Fournisseur supprimé']);
    }
}
