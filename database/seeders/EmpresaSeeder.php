<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use App\Models\Empresa;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Copiar logos al storage públic
        $origenDir = database_path('seeders/data/logos');
        $destiDir = storage_path('app/public/logos');

        if (!File::isDirectory($destiDir)) {
            File::makeDirectory($destiDir, 0755, true);
        }

        $logos = [
            'logotip_empresa1.jpg',
            'logotip_empresa2.jpg',
            'logotip_empresa3.jpeg',
        ];

        foreach ($logos as $logo) {
            $origen = $origenDir . '/' . $logo;
            if (File::exists($origen)) {
                File::copy($origen, $destiDir . '/' . $logo);
            }
        }

        Empresa::create([
            'title' => 'Empresa 1',
            'description' => 'Desenvolupament de software',
            'location' => 'Palma',
            'telefon' => '971 123 456',
            'nom_empresari' => 'Pere Soler',
            'logo' => 'logos/logotip_empresa1.jpg',
        ]);

        Empresa::create([
            'title' => 'Empresa 2',
            'description' => 'Programació Orientada a Objectes',
            'location' => 'Inca',
            'telefon' => '971 654 321',
            'nom_empresari' => 'Marta Vidal',
            'logo' => 'logos/logotip_empresa2.jpg',
        ]);

        Empresa::create([
            'title' => 'Empresa 3',
            'description' => 'Màrqueting digital',
            'location' => 'Manacor',
            'telefon' => '971 789 012',
            'nom_empresari' => 'Joan Riera',
            'logo' => 'logos/logotip_empresa3.jpeg',
        ]);
    }
}
