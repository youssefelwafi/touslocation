<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\TenantScoped;
use App\Models\Depense;
use App\Models\Paiement;
use App\Models\Achat;
use App\Models\Location;
use App\Models\Vente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RapportController extends Controller
{
    use TenantScoped;

    private function range(Request $request): array
    {
        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());

        return [$from, $to];
    }

    // Liste des mois (YYYY-MM) couverts par la période, bornée à 24 mois.
    private function months(string $from, string $to): array
    {
        $start = \Carbon\Carbon::parse($from)->startOfMonth();
        $end = \Carbon\Carbon::parse($to)->startOfMonth();
        $months = [];
        while ($start <= $end && count($months) < 24) {
            $months[] = $start->format('Y-m');
            $start->addMonth();
        }

        return $months;
    }

    // Somme par mois d'une colonne, indexée sur YYYY-MM.
    private function sumByMonth($query, string $dateColumn, string $valueColumn): array
    {
        return $query->selectRaw("DATE_FORMAT($dateColumn, '%Y-%m') as ym, sum($valueColumn) as v")
            ->groupBy('ym')->pluck('v', 'ym')->map(fn ($v) => (float) $v)->toArray();
    }

    // Rapport de bénéfice : revenus (locations + ventes) − coûts (achats + dépenses).
    public function profit(Request $request): JsonResponse
    {
        $this->requireModule($request, "rapports");
        [$from, $to] = $this->range($request);

        $rentalsRevenue = (float) $this->scopeToTenant(Location::query(), $request)
            ->where('statut', '!=', 'cancelled')->whereBetween('date_debut', [$from, $to])->sum('montant_total');
        $salesRevenue = (float) $this->scopeToTenant(Vente::query(), $request)
            ->whereBetween('date_vente', [$from, $to])->sum('montant_total');
        $purchasesCost = (float) $this->scopeToTenant(Achat::query(), $request)
            ->where('statut', 'received')->whereBetween('date_achat', [$from, $to])->sum('montant_total');
        $expensesTotal = (float) $this->scopeToTenant(Depense::query(), $request)
            ->whereBetween('date_depense', [$from, $to])->sum('montant');

        $revenue = $rentalsRevenue + $salesRevenue;
        $cost = $purchasesCost + $expensesTotal;

        // Série mensuelle : revenu vs coût vs bénéfice.
        $rentalsByMonth = $this->sumByMonth(
            $this->scopeToTenant(Location::query(), $request)->where('statut', '!=', 'cancelled')->whereBetween('date_debut', [$from, $to]),
            'date_debut', 'montant_total'
        );
        $salesByMonth = $this->sumByMonth(
            $this->scopeToTenant(Vente::query(), $request)->whereBetween('date_vente', [$from, $to]),
            'date_vente', 'montant_total'
        );
        $purchasesByMonth = $this->sumByMonth(
            $this->scopeToTenant(Achat::query(), $request)->where('statut', 'received')->whereBetween('date_achat', [$from, $to]),
            'date_achat', 'montant_total'
        );
        $expensesByMonth = $this->sumByMonth(
            $this->scopeToTenant(Depense::query(), $request)->whereBetween('date_depense', [$from, $to]),
            'date_depense', 'montant'
        );

        $monthly = array_map(function ($ym) use ($rentalsByMonth, $salesByMonth, $purchasesByMonth, $expensesByMonth) {
            $rev = ($rentalsByMonth[$ym] ?? 0) + ($salesByMonth[$ym] ?? 0);
            $cst = ($purchasesByMonth[$ym] ?? 0) + ($expensesByMonth[$ym] ?? 0);

            return ['month' => $ym, 'revenue' => $rev, 'cost' => $cst, 'profit' => $rev - $cst];
        }, $this->months($from, $to));

        return response()->json([
            'from' => $from, 'to' => $to,
            'rentals_revenue' => $rentalsRevenue,
            'sales_revenue' => $salesRevenue,
            'revenue' => $revenue,
            'purchases_cost' => $purchasesCost,
            'expenses_total' => $expensesTotal,
            'cost' => $cost,
            'profit' => $revenue - $cost,
            'margin' => $revenue > 0 ? round(($revenue - $cost) / $revenue * 100, 1) : 0,
            'monthly' => $monthly,
        ]);
    }

    // Rapport de locations.
    public function rentals(Request $request): JsonResponse
    {
        $this->requireModule($request, "rapports");
        [$from, $to] = $this->range($request);

        $base = fn () => $this->scopeToTenant(Location::query(), $request)->whereBetween('date_debut', [$from, $to]);

        $byStatus = (clone $base())->selectRaw('statut, count(*) as c, sum(montant_total) as total')
            ->groupBy('statut')->get()
            ->map(fn ($r) => ['status' => $r->statut, 'count' => (int) $r->c, 'total' => (float) $r->total]);

        $totalTtc = (float) $base()->where('statut', '!=', 'cancelled')->sum('montant_total');
        $count = (int) $base()->count();

        // Encaissé sur ces locations.
        $rentalIds = $base()->pluck('id');
        $paid = (float) Paiement::whereIn('location_id', $rentalIds)->sum('montant');

        // Top matériel loué (quantité).
        $top = \App\Models\LigneLocation::whereIn('location_id', $rentalIds)
            ->selectRaw('materiel_id, sum(quantite) as qty')
            ->groupBy('materiel_id')->orderByDesc('qty')->limit(5)->with('materiel:id,nom')->get()
            ->map(fn ($r) => ['name' => $r->materiel?->nom ?? '—', 'qty' => (int) $r->qty]);

        // Série mensuelle : nombre de locations + chiffre d'affaires.
        $countByMonth = (clone $base())->selectRaw("DATE_FORMAT(date_debut, '%Y-%m') as ym, count(*) as c")
            ->groupBy('ym')->pluck('c', 'ym')->map(fn ($v) => (int) $v)->toArray();
        $totalByMonth = $this->sumByMonth((clone $base())->where('statut', '!=', 'cancelled'), 'date_debut', 'montant_total');
        $monthly = array_map(fn ($ym) => [
            'month' => $ym,
            'count' => $countByMonth[$ym] ?? 0,
            'total' => $totalByMonth[$ym] ?? 0,
        ], $this->months($from, $to));

        return response()->json([
            'from' => $from, 'to' => $to,
            'count' => $count,
            'total_ttc' => $totalTtc,
            'paid' => $paid,
            'outstanding' => max(0, $totalTtc - $paid),
            'by_status' => $byStatus,
            'top_equipments' => $top,
            'monthly' => $monthly,
        ]);
    }
}
