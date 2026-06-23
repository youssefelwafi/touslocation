<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Tables possédées par un "tenant" (manager). Le super-admin voit tout.
    private array $tables = ['categories', 'marques', 'unites', 'devises', 'types_paiement', 'materiels', 'locations'];

    public function up(): void
    {
        foreach ($this->tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->foreignId('proprietaire_id')->nullable()->after('id')->constrained('utilisateurs')->nullOnDelete();
            });
        }

        // Code devise unique par tenant.
        Schema::table('devises', function (Blueprint $table) {
            $table->unique(['proprietaire_id', 'code']);
        });
    }

    public function down(): void
    {
        foreach ($this->tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropConstrainedForeignId('proprietaire_id');
            });
        }
    }
};
