<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('nom');
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('adresse')->nullable();
            $table->timestamps();
        });

        Schema::create('achats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete(); // créé par
            $table->string('reference')->nullable();
            $table->date('date_achat');
            $table->enum('statut', ['pending', 'received'])->default('received');
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('lignes_achat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('achat_id')->constrained('achats')->cascadeOnDelete();
            $table->foreignId('materiel_id')->constrained('materiels')->cascadeOnDelete();
            $table->unsignedInteger('quantite');
            $table->decimal('cout_unitaire', 10, 2)->default(0);
            $table->decimal('sous_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('ajustements_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('materiel_id')->constrained('materiels')->cascadeOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->enum('type', ['in', 'out']);          // entrée / sortie
            $table->unsignedInteger('quantite');
            $table->integer('quantite_avant');
            $table->integer('quantite_apres');
            $table->string('motif');                       // ex: casse, perte, correction
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ajustements_stock');
        Schema::dropIfExists('lignes_achat');
        Schema::dropIfExists('achats');
        Schema::dropIfExists('fournisseurs');
    }
};
