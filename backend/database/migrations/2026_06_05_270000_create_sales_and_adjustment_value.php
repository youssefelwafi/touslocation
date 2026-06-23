<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('reference')->nullable();
            $table->date('date_vente');
            $table->decimal('sous_total', 12, 2)->default(0);   // HT
            $table->decimal('taux_taxe', 5, 2)->default(20);
            $table->decimal('montant_taxe', 12, 2)->default(0);
            $table->decimal('montant_total', 12, 2)->default(0); // TTC
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('lignes_vente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vente_id')->constrained('ventes')->cascadeOnDelete();
            $table->foreignId('materiel_id')->constrained('materiels')->cascadeOnDelete();
            $table->unsignedInteger('quantite');
            $table->decimal('prix_unitaire', 10, 2)->default(0);
            $table->decimal('sous_total', 12, 2)->default(0);
            $table->timestamps();
        });

        // Valorisation des ajustements (basée sur le prix d'achat).
        Schema::table('ajustements_stock', function (Blueprint $table) {
            $table->decimal('valeur_unitaire', 10, 2)->nullable()->after('quantite_apres');
            $table->decimal('valeur_totale', 12, 2)->nullable()->after('valeur_unitaire');
        });
    }

    public function down(): void
    {
        Schema::table('ajustements_stock', function (Blueprint $table) {
            $table->dropColumn(['valeur_unitaire', 'valeur_totale']);
        });
        Schema::dropIfExists('lignes_vente');
        Schema::dropIfExists('ventes');
    }
};
