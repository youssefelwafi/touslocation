<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FactureController extends Controller
{
    public function download(Request $request, Location $location): Response
    {
        // Staff, ou le client propriétaire de la location.
        abort_unless(
            $request->user()->isStaff() || $request->user()->id === $location->utilisateur_id,
            403
        );

        $location->load(['utilisateur', 'employe', 'lignes.materiel.devise', 'paiements.typePaiement']);

        // Devise par défaut pour l'affichage des montants.
        $symbole = \App\Models\Devise::where('par_defaut', true)->value('symbole') ?? 'DH';

        $pdf = Pdf::loadView('facture', [
            'location' => $location,
            'symbole' => $symbole,
            'numero' => 'FACT-'.str_pad((string) $location->id, 5, '0', STR_PAD_LEFT),
        ])->setPaper('a4');

        return $pdf->download("facture-{$location->id}.pdf");
    }
}
