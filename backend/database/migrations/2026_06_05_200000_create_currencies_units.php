<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devises', function (Blueprint $table) {
            $table->id();
            $table->string('nom');                  // ex: Euro
            $table->string('code', 3);              // ex: EUR (unique par tenant)
            $table->string('symbole', 8);           // ex: €
            $table->decimal('taux_change', 12, 4)->default(1); // par rapport à la devise par défaut
            $table->boolean('par_defaut')->default(false);
            $table->timestamps();
        });

        Schema::create('unites', function (Blueprint $table) {
            $table->id();
            $table->string('nom');          // ex: Jour
            $table->string('symbole', 16);  // ex: j
            $table->timestamps();
        });

        Schema::table('materiels', function (Blueprint $table) {
            $table->foreignId('unite_id')->nullable()->after('prix_par_jour')->constrained('unites')->nullOnDelete();
            $table->foreignId('devise_id')->nullable()->after('unite_id')->constrained('devises')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('unite_id');
            $table->dropConstrainedForeignId('devise_id');
        });
        Schema::dropIfExists('unites');
        Schema::dropIfExists('devises');
    }
};
