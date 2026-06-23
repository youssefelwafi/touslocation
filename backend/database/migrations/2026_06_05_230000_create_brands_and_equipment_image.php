<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marques', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('materiels', function (Blueprint $table) {
            $table->foreignId('marque_id')->nullable()->after('categorie_id')->constrained('marques')->nullOnDelete();
            // la colonne `image` existe déjà (création initiale)
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('marque_id');
        });
        Schema::dropIfExists('marques');
    }
};
