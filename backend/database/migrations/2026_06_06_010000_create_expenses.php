<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->foreignId('type_paiement_id')->nullable()->constrained('types_paiement')->nullOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('categorie');        // Loyer, Salaires, Électricité…
            $table->string('libelle');          // intitulé
            $table->decimal('montant', 12, 2);
            $table->date('date_depense');
            $table->string('reference')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};
