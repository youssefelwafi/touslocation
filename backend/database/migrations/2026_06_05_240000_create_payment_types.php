<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('types_paiement', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('type_paiement_id')->nullable()->after('location_id')->constrained('types_paiement')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('type_paiement_id');
        });
        Schema::dropIfExists('types_paiement');
    }
};
