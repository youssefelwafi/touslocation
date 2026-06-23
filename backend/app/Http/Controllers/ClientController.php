<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    use TenantScoped;

    // Numéro marocain : +212 ou 0, puis 5/6/7 et 8 chiffres. Ex : 0612345678, +212612345678.
    private const PHONE_REGEX = 'regex:/^(?:\+212|0)[5-7]\d{8}$/';

    // Normalise vers le format international +2126XXXXXXXX.
    private function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }
        $phone = preg_replace('/[\s.-]/', '', $phone);

        return preg_replace('/^0/', '+212', $phone);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $query = Utilisateur::where('role', 'client')
            ->withCount('locations')
            ->latest();
        $this->scopeToTenant($query, $request);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }
        if ($statut = $request->query('status')) {
            $query->where('statut', $statut);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, 'clients');

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:utilisateurs,email'],
            'telephone' => ['nullable', 'string', self::PHONE_REGEX],
            'password' => ['required', 'string', 'min:6'],
            'statut' => ['nullable', 'in:active,inactive'],
        ], $this->phoneMessages());

        $data['role'] = 'client';
        $data['proprietaire_id'] = $this->ownerId($request);
        $data['password'] = Hash::make($data['password']);
        $data['statut'] ??= 'active';
        $data['telephone'] = $this->normalizePhone($data['telephone'] ?? null);

        $client = Utilisateur::create($data);

        return response()->json($client, 201);
    }

    public function show(Request $request, Utilisateur $client): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);
        $this->ensureClient($client);
        $this->ensureOwned($request, $client);

        return response()->json($client->loadCount('locations'));
    }

    public function update(Request $request, Utilisateur $client): JsonResponse
    {
        $this->requireModule($request, 'clients');
        $this->ensureClient($client);
        $this->ensureOwned($request, $client);

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('utilisateurs', 'email')->ignore($client->id)],
            'telephone' => ['nullable', 'string', self::PHONE_REGEX],
            'password' => ['nullable', 'string', 'min:6'],
            'statut' => ['sometimes', 'in:active,inactive'],
        ], $this->phoneMessages());

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (array_key_exists('telephone', $data)) {
            $data['telephone'] = $this->normalizePhone($data['telephone']);
        }

        $client->update($data);

        return response()->json($client->fresh());
    }

    public function destroy(Request $request, Utilisateur $client): JsonResponse
    {
        $this->requireModule($request, 'clients');
        $this->ensureClient($client);
        $this->ensureOwned($request, $client);

        abort_if($client->locations()->exists(), 422, 'Client lié à des locations : suppression impossible.');

        $client->delete();

        return response()->json(['message' => 'Client supprimé']);
    }

    private function ensureClient(Utilisateur $client): void
    {
        abort_unless($client->role === 'client', 404, 'Client introuvable.');
    }

    private function phoneMessages(): array
    {
        return [
            'telephone.regex' => 'Numéro marocain invalide (ex : 0612345678 ou +212612345678).',
        ];
    }
}
