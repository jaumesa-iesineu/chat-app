<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Empresa;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Empresa::create([
            'title' => 'Empresa 1',
            'description' => 'Desenvolupament de software',
            'location' => 'Palma',
            'telefon' => '971 123 456',
            'nom_empresari' => 'Pere Soler',
        ]);

        Empresa::create([
            'title' => 'Empresa 2',
            'description' => 'Programació Orientada a Objectes',
            'location' => 'Inca',
            'telefon' => '971 654 321',
            'nom_empresari' => 'Marta Vidal',
        ]);

        Empresa::create([
            'title' => 'Empresa 3',
            'description' => 'Màrqueting digital',
            'location' => 'Manacor',
            'telefon' => '971 789 012',
            'nom_empresari' => 'Joan Riera',
        ]);
    }
}
