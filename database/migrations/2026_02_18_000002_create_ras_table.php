<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ras', function (Blueprint $table) {
            $table->id();
            $table->string('resultat_aprenentatge_codi');
            $table->text('ra');
            $table->text('descripcio')->nullable();
            $table->timestamps();

            $table->foreign('resultat_aprenentatge_codi')
                ->references('codi')
                ->on('resultats_aprenentatge')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ras');
    }
};
