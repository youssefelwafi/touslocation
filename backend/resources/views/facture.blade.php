<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #1f2937; font-size: 12px; margin: 0; padding: 28px; }
        .head { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 14px; }
        .brand { font-size: 26px; font-weight: bold; color: #2563eb; }
        .brand small { display: block; font-size: 11px; color: #6b7280; font-weight: normal; }
        .doc-title { text-align: right; }
        .doc-title h1 { margin: 0; font-size: 22px; color: #111827; }
        .doc-title .num { color: #6b7280; }
        .meta { width: 100%; margin: 22px 0; }
        .meta td { vertical-align: top; width: 50%; }
        .box-title { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; letter-spacing: .5px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.items th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569; }
        table.items td { padding: 8px 10px; border-bottom: 1px solid #eef2f7; }
        .right { text-align: right; }
        .totals { width: 45%; float: right; margin-top: 14px; }
        .totals td { padding: 6px 10px; }
        .totals .ttc td { border-top: 2px solid #111827; font-weight: bold; font-size: 14px; }
        .totals .label { color: #6b7280; }
        .pay { clear: both; padding-top: 26px; }
        .pay h3 { font-size: 13px; margin-bottom: 6px; }
        table.pays { width: 100%; border-collapse: collapse; }
        table.pays th { text-align: left; padding: 6px 8px; font-size: 11px; color: #475569; border-bottom: 1px solid #e2e8f0; }
        table.pays td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
        .balance { margin-top: 10px; padding: 10px 12px; background: #f8fafc; border-radius: 6px; }
        .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; }
        .paid { background: #dcfce7; color: #166534; }
        .partial { background: #fef9c3; color: #854d0e; }
        .unpaid { background: #fee2e2; color: #991b1b; }
        .foot { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    @php
        $money = fn ($n) => number_format((float) $n, 2, ',', ' ').' '.$symbole;
        $date = fn ($d) => $d ? \Illuminate\Support\Carbon::parse($d)->format('d/m/Y') : '-';
        $statusLabels = ['paid' => 'Payé', 'partial' => 'Partiel', 'unpaid' => 'Non payé'];
    @endphp

    <div class="head">
        <div class="brand">TousLocation<small>Location de matériel — Maroc</small></div>
        <div class="doc-title">
            <h1>FACTURE</h1>
            <div class="num">N° {{ $numero }}</div>
            <div class="num">Date : {{ $date(now()) }}</div>
        </div>
    </div>

    <table class="meta">
        <tr>
            <td>
                <div class="box-title">Client</div>
                <strong>{{ $location->utilisateur->nom }}</strong><br>
                {{ $location->utilisateur->email }}<br>
                {{ $location->utilisateur->telephone }}
            </td>
            <td>
                <div class="box-title">Location</div>
                Période : {{ $date($location->date_debut) }} → {{ $date($location->date_fin) }}<br>
                Statut : {{ ucfirst($location->statut) }}<br>
                @if($location->employe) Géré par : {{ $location->employe->nom }} @endif
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="right">Prix/jour</th>
                <th class="right">Qté</th>
                <th class="right">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($location->lignes as $ligne)
            <tr>
                <td>{{ $ligne->materiel->nom ?? '—' }}</td>
                <td class="right">{{ $money($ligne->prix_unitaire) }}</td>
                <td class="right">{{ $ligne->quantite }}</td>
                <td class="right">{{ $money($ligne->sous_total) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="label">Total HT</td>
            <td class="right">{{ $money($location->sous_total) }}</td>
        </tr>
        <tr>
            <td class="label">TVA ({{ rtrim(rtrim(number_format($location->taux_taxe, 2), '0'), '.') }} %)</td>
            <td class="right">{{ $money($location->montant_taxe) }}</td>
        </tr>
        <tr class="ttc">
            <td>Total TTC</td>
            <td class="right">{{ $money($location->montant_total) }}</td>
        </tr>
    </table>

    <div class="pay">
        <h3>Paiements</h3>
        @if($location->paiements->count())
        <table class="pays">
            <thead>
                <tr><th>Date</th><th>Mode</th><th>Note</th><th class="right">Montant</th></tr>
            </thead>
            <tbody>
                @foreach($location->paiements as $paiement)
                <tr>
                    <td>{{ $date($paiement->date_paiement) }}</td>
                    <td>{{ $paiement->typePaiement->nom ?? $paiement->mode }}</td>
                    <td>{{ $paiement->note }}</td>
                    <td class="right">{{ $money($paiement->montant) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
            <em style="color:#9ca3af">Aucun paiement enregistré.</em>
        @endif

        <div class="balance">
            <table style="width:100%">
                <tr>
                    <td>Payé : <strong>{{ $money($location->montant_paye) }}</strong></td>
                    <td class="right">
                        Reste à payer : <strong>{{ $money($location->montant_restant) }}</strong>
                        <span class="badge {{ $location->statut_paiement }}">{{ $statusLabels[$location->statut_paiement] }}</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="foot">
        TousLocation — Merci de votre confiance · Facture générée le {{ $date(now()) }}
    </div>
</body>
</html>
