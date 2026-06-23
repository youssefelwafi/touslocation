<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add role/phone/status to the existing utilisateurs table.
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->enum('role', ['admin', 'manager', 'employee', 'client'])->default('client')->after('email');
            $table->foreignId('proprietaire_id')->nullable()->after('role')->constrained('utilisateurs')->nullOnDelete();
            $table->string('telephone')->nullable()->after('role');
            $table->enum('statut', ['active', 'inactive'])->default('active')->after('telephone');
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('materiels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categorie_id')->constrained('categories')->cascadeOnDelete();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->decimal('prix_par_jour', 10, 2)->default(0);
            $table->unsignedInteger('quantite')->default(1);
            $table->enum('statut', ['available', 'maintenance', 'inactive'])->default('available');
            $table->string('image')->nullable();
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->foreignId('employe_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->date('date_retour')->nullable();
            $table->enum('statut', ['pending', 'confirmed', 'ongoing', 'returned', 'cancelled'])->default('pending');
            $table->decimal('montant_total', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('lignes_location', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->foreignId('materiel_id')->constrained('materiels')->cascadeOnDelete();
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2)->default(0);
            $table->decimal('sous_total', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('contrats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('numero_contrat')->unique();
            $table->string('chemin_pdf')->nullable();
            $table->timestamp('date_generation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contrats');
        Schema::dropIfExists('lignes_location');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('materiels');
        Schema::dropIfExists('categories');
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['role', 'telephone', 'statut']);
        });
    }
};
