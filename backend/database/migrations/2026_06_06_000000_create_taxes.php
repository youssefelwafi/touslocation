<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('nom');
            $table->decimal('taux', 5, 2)->default(0);   // % TVA
            $table->boolean('par_defaut')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
