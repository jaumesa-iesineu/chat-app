<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Ra;

class RaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Ra::create(['descripcio' => 'test ra 1', 'resultat_aprenentatge_codi' => 'RA1']);
        Ra::create(['descripcio' => 'test ra 2', 'resultat_aprenentatge_codi' => 'RA1']);

        Ra::create(['descripcio' => 'test ra 3', 'resultat_aprenentatge_codi' => 'RA2']);
        Ra::create(['descripcio' => 'test ra 4', 'resultat_aprenentatge_codi' => 'RA2']);

        Ra::create(['descripcio' => 'test ra 5', 'resultat_aprenentatge_codi' => 'RA3']);
        Ra::create(['descripcio' => 'test ra 6', 'resultat_aprenentatge_codi' => 'RA3']);
    }
}
