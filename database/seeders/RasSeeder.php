<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ra;
use App\Models\ResultatsAprenentatge;

class RasSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/ras.csv');
        $file = fopen($path, 'r');

        // Skip header row
        fgetcsv($file, 0, ';');

        while (($row = fgetcsv($file, 0, ';')) !== false) {
            [$codi, $modul, $ra, $descripcio] = array_pad($row, 4, null);

            // Normalize whitespace (multiline fields may have newlines)
            $codi   = trim($codi);
            $modul  = trim($modul);
            $ra     = trim($ra);
            $descripcio = $descripcio !== null && trim($descripcio) !== '' ? trim($descripcio) : null;

            ResultatsAprenentatge::updateOrCreate(
                ['codi' => $codi],
                ['modul' => $modul]
            );

            Ra::create([
                'resultat_aprenentatge_codi' => $codi,
                'ra'          => $ra,
                'descripcio'  => $descripcio,
            ]);
        }

        fclose($file);
    }
}
