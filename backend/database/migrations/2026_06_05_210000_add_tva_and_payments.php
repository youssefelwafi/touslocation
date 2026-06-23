<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TVA marocaine sur les locations.
        Schema::table('locations', function (Blueprint $table) {
            $table->decimal('sous_total', 10, 2)->default(0)->after('statut');   // HT
            $table->decimal('taux_taxe', 5, 2)->default(20)->after('sous_total'); // % TVA
            $table->decimal('montant_taxe', 10, 2)->default(0)->after('taux_taxe');
            // montant_total existant = TTC
        });

        // Paiements partiels.
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete(); // qui a encaissé
            $table->decimal('montant', 10, 2);
            $table->enum('mode', ['cash', 'card', 'transfer', 'check'])->default('cash');
            $table->date('date_paiement');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['sous_total', 'taux_taxe', 'montant_taxe']);
        });
    }
};
