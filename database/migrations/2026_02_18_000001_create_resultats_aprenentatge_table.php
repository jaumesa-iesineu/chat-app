<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resultats_aprenentatge', function (Blueprint $table) {
            $table->string('codi')->primary();
            $table->string('modul');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resultats_aprenentatge');
    }
};
