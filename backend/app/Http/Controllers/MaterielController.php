<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Materiel;
use App\Models\LigneLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MaterielController extends Controller
{
    use TenantScoped;

    private const ACTIVE_STATUSES = ['pending', 'confirmed', 'ongoing'];
    private const EAGER = ['categorie', 'marque', 'unite', 'devise'];

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403); // catalogue de gestion (clients : voir /shops)
        // prix_achat = dernier coût d'achat connu de l'article (placeholder de valorisation).
        $query = Materiel::with(self::EAGER)
            ->addSelect(['prix_achat' => \App\Models\LigneAchat::select('cout_unitaire')
                ->whereColumn('materiel_id', 'materiels.id')
                ->latest('id')
                ->limit(1),
            ])
            ->latest();
        $this->scopeToTenant($query, $request);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('marque', fn ($b) => $b->where('nom', 'like', "%{$search}%"))
                  ->orWhereHas('categorie', fn ($c) => $c->where('nom', 'like', "%{$search}%"));
            });
        }
        if ($categoryId = $request->query('categorie_id')) {
            $query->where('categorie_id', $categoryId);
        }
        if ($brandId = $request->query('marque_id')) {
            $query->where('marque_id', $brandId);
        }
        if ($status = $request->query('statut')) {
            $query->where('statut', $status);
        }

        $perPage = (int) $request->query('per_page', 15);

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireModule($request, 'materiels');

        $data = $request->validate([
            'categorie_id' => ['required', 'exists:categories,id'],
            'marque_id' => ['nullable', 'exists:marques,id'],
            'unite_id' => ['nullable', 'exists:unites,id'],
            'devise_id' => ['nullable', 'exists:devises,id'],
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'prix_par_jour' => ['required', 'numeric', 'min:0'],
            'quantite' => ['required', 'integer', 'min:0'],
            'jours_tampon' => ['nullable', 'integer', 'min:0', 'max:365'],
            'note_tampon' => ['nullable', 'string', 'max:255'],
            'statut' => ['nullable', 'in:available,maintenance,inactive'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('materiels', 'public');
        }
        $data['proprietaire_id'] = $this->ownerId($request);

        $materiel = Materiel::create($data);

        return response()->json($materiel->load(self::EAGER), 201);
    }

    public function show(Request $request, Materiel $materiel): JsonResponse
    {
        $this->ensureOwned($request, $materiel);

        return response()->json($materiel->load(self::EAGER));
    }

    // Disponibilité de tout le catalogue sur une période (?from=&to=) pour le sélecteur.
    public function availabilityRange(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);
        $start = Carbon::parse($data['from']);
        $end = Carbon::parse($data['to']);

        $equipments = $this->scopeToTenant(Materiel::query(), $request)->get(['id', 'quantite', 'jours_tampon']);
        $items = LigneLocation::whereHas('location', fn ($q) => $q->whereIn('statut', self::ACTIVE_STATUSES))
            ->with('location:id,date_debut,date_fin')
            ->get();

        $byEquipment = $items->groupBy('materiel_id');
        $result = [];
        foreach ($equipments as $eq) {
            $reservations = $byEquipment->get($eq->id, collect());
            $maxReserved = 0;
            for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
                $reserved = 0;
                foreach ($reservations as $it) {
                    $rs = Carbon::parse($it->location->date_debut);
                    $re = Carbon::parse($it->location->date_fin)->addDays($eq->jours_tampon);
                    if ($d->betweenIncluded($rs, $re)) {
                        $reserved += $it->quantite;
                    }
                }
                $maxReserved = max($maxReserved, $reserved);
            }
            $result[$eq->id] = max(0, $eq->quantite - $maxReserved);
        }

        return response()->json($result);
    }

    // Calendrier de disponibilité d'un article pour un mois donné (?month=YYYY-MM).
    public function availability(Request $request, Materiel $materiel): JsonResponse
    {
        $this->ensureOwned($request, $materiel);
        $month = $request->query('month');
        $start = $month
            ? \Illuminate\Support\Carbon::createFromFormat('Y-m', $month)->startOfMonth()
            : now()->startOfMonth();
        $end = $start->copy()->endOfMonth();

        // Réservations actives sur cet article (hors retournées / annulées).
        $items = \App\Models\LigneLocation::with('location.utilisateur')
            ->where('materiel_id', $materiel->id)
            ->whereHas('location', fn ($q) => $q->whereIn('statut', ['pending', 'confirmed', 'ongoing']))
            ->get();

        // Liste des réservations (avec fenêtre de battement après location).
        $bookings = $items->map(function ($it) use ($materiel) {
            $rs = \Illuminate\Support\Carbon::parse($it->location->date_debut);
            $re = \Illuminate\Support\Carbon::parse($it->location->date_fin);

            return [
                'rental_id' => $it->location_id,
                'client' => $it->location->utilisateur?->nom,
                'status' => $it->location->statut,
                'quantity' => $it->quantite,
                'start' => $rs->toDateString(),
                'end' => $re->toDateString(),
                'buffer_until' => $re->copy()->addDays($materiel->jours_tampon)->toDateString(),
            ];
        })->values();

        // Disponibilité jour par jour pour le mois demandé.
        $days = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $reserved = 0;
            $bufferReserved = 0;
            foreach ($items as $it) {
                $rs = \Illuminate\Support\Carbon::parse($it->location->date_debut);
                $re = \Illuminate\Support\Carbon::parse($it->location->date_fin);
                $bu = $re->copy()->addDays($materiel->jours_tampon);

                if ($d->betweenIncluded($rs, $re)) {
                    $reserved += $it->quantite;
                } elseif ($materiel->jours_tampon > 0 && $d->gt($re) && $d->lte($bu)) {
                    $bufferReserved += $it->quantite;
                }
            }
            $available = max(0, $materiel->quantite - $reserved - $bufferReserved);
            $days[] = [
                'date' => $d->toDateString(),
                'reserved' => $reserved,
                'buffer' => $bufferReserved > 0,
                'available' => $available,
                'blocked' => $available <= 0,
            ];
        }

        return response()->json([
            'equipment' => [
                'id' => $materiel->id,
                'name' => $materiel->nom,
                'quantity' => $materiel->quantite,
                'buffer_days' => $materiel->jours_tampon,
                'buffer_note' => $materiel->note_tampon,
            ],
            'month' => $start->format('Y-m'),
            'days' => $days,
            'bookings' => $bookings,
        ]);
    }

    public function update(Request $request, Materiel $materiel): JsonResponse
    {
        $this->requireModule($request, 'materiels');
        $this->ensureOwned($request, $materiel);

        $data = $request->validate([
            'categorie_id' => ['sometimes', 'exists:categories,id'],
            'marque_id' => ['nullable', 'exists:marques,id'],
            'unite_id' => ['nullable', 'exists:unites,id'],
            'devise_id' => ['nullable', 'exists:devises,id'],
            'nom' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'prix_par_jour' => ['sometimes', 'numeric', 'min:0'],
            'quantite' => ['sometimes', 'integer', 'min:0'],
            'jours_tampon' => ['nullable', 'integer', 'min:0', 'max:365'],
            'note_tampon' => ['nullable', 'string', 'max:255'],
            'statut' => ['sometimes', 'in:available,maintenance,inactive'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($materiel->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($materiel->image);
            }
            $data['image'] = $request->file('image')->store('materiels', 'public');
        }

        $materiel->update($data);

        return response()->json($materiel->load(self::EAGER));
    }

    public function destroy(Request $request, Materiel $materiel): JsonResponse
    {
        $this->requireModule($request, 'materiels');
        $this->ensureOwned($request, $materiel);
        if ($materiel->image) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($materiel->image);
        }
        $materiel->delete();

        return response()->json(['message' => 'Matériel supprimé']);
    }

    private function authorizeStaff(Request $request): void
    {
        abort_unless($request->user()->isStaff(), 403, 'Action non autorisée.');
    }
}
