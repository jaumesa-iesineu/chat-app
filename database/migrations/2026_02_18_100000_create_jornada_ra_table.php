<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jornada_ra', function (Blueprint $table) {
            $table->foreignId('jornada_id')->constrained('jornades')->cascadeOnDelete();
            $table->foreignId('ra_id')->constrained('ras')->cascadeOnDelete();
            $table->unique(['jornada_id', 'ra_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jornada_ra');
    }
};
