<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Support\TenantProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Inscription publique d'un MANAGER (nouvel espace de travail / tenant).
    public function registerManager(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:utilisateurs,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = Utilisateur::create([
                'nom' => $data['nom'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'manager',
                'proprietaire_id' => null, // un manager est un tenant racine
                'statut' => 'active',
            ]);
            // Référentiels par défaut pour que l'espace soit utilisable de suite.
            TenantProvisioner::provision($user->id);

            return $user;
        });

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    // Inscription publique d'un CLIENT rattaché à une boutique (manager).
    public function registerClient(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:utilisateurs,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'manager_id' => ['required', 'exists:utilisateurs,id'],
        ]);

        $manager = Utilisateur::find($data['manager_id']);
        abort_unless($manager && $manager->role === 'manager', 422, 'Boutique invalide.');

        $user = Utilisateur::create([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'password' => $data['password'],
            'telephone' => $data['telephone'] ?? null,
            'role' => 'client',
            'proprietaire_id' => $manager->id,
            'statut' => 'active',
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:utilisateurs,email'],
            'password' => ['required', 'string', 'min:6'],
            'telephone' => ['nullable', 'string', 'max:30'],
        ]);

        $data['role'] = 'client';
        $user = Utilisateur::create($data);
        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = Utilisateur::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants invalides.'],
            ]);
        }

        if ($user->statut !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Compte désactivé.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
