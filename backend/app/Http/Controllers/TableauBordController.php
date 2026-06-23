<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Materiel;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableauBordController extends Controller
{
    use TenantScoped;

    public function stats(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $byStatus = $this->scopeToTenant(Location::query(), $request)
            ->selectRaw('statut, count(*) as c')
            ->groupBy('statut')
            ->pluck('c', 'statut');

        $revenue = $this->scopeToTenant(Location::query(), $request)
            ->where('statut', '!=', 'cancelled')->sum('montant_total');

        return response()->json([
            'total_revenue' => (float) $revenue,
            'active_rentals' => $this->scopeToTenant(Location::query(), $request)->where('statut', 'ongoing')->count(),
            'total_equipments' => $this->scopeToTenant(Materiel::query(), $request)->count(),
            'available_equipments' => $this->scopeToTenant(Materiel::query(), $request)->where('statut', 'available')->sum('quantite'),
            'rentals_by_status' => [
                'pending' => (int) ($byStatus['pending'] ?? 0),
                'confirmed' => (int) ($byStatus['confirmed'] ?? 0),
                'ongoing' => (int) ($byStatus['ongoing'] ?? 0),
                'returned' => (int) ($byStatus['returned'] ?? 0),
                'cancelled' => (int) ($byStatus['cancelled'] ?? 0),
            ],
        ]);
    }
}
