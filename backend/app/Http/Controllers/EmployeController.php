<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

// Gestion des employés d'un espace (réservée au manager / super-admin).
class EmployeController extends Controller
{
    use TenantScoped;

    private function gate(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['manager', 'admin'], true), 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->gate($request);
        $query = Utilisateur::where('role', 'employee')->withCount(['locationsGerees as rentals_count'])->latest();
        $this->scopeToTenant($query, $request);

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->gate($request);

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:utilisateurs,email'],
            'password' => ['required', 'string', 'min:6'],
            'statut' => ['nullable', 'in:active,inactive'],
            'permissions' => ['array'],
            'permissions.*' => [Rule::in(Utilisateur::MODULES)],
        ]);

        $employe = Utilisateur::create([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'employee',
            'proprietaire_id' => $this->ownerId($request),
            'statut' => $data['statut'] ?? 'active',
            'permissions' => $data['permissions'] ?? [],
        ]);

        return response()->json($employe, 201);
    }

    public function update(Request $request, Utilisateur $employe): JsonResponse
    {
        $this->gate($request);
        $this->ensureEmployee($request, $employe);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('utilisateurs', 'email')->ignore($employe->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'statut' => ['sometimes', 'in:active,inactive'],
            'permissions' => ['array'],
            'permissions.*' => [Rule::in(Utilisateur::MODULES)],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $employe->update($data);

        return response()->json($employe->fresh());
    }

    public function destroy(Request $request, Utilisateur $employe): JsonResponse
    {
        $this->gate($request);
        $this->ensureEmployee($request, $employe);
        $employe->delete();

        return response()->json(['message' => 'Employé supprimé']);
    }

    private function ensureEmployee(Request $request, Utilisateur $employe): void
    {
        abort_unless($employe->role === 'employee', 404);
        $this->ensureOwned($request, $employe);
    }
}
