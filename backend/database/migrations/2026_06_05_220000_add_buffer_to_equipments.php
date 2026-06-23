<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            // Délai d'indisponibilité après une location (nettoyage, contrôle...).
            $table->unsignedInteger('jours_tampon')->default(0)->after('quantite');
            $table->string('note_tampon')->nullable()->after('jours_tampon');
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropColumn(['jours_tampon', 'note_tampon']);
        });
    }
};
