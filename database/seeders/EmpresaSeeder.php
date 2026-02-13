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
        ]);

        Empresa::create([
            'title' => 'Empresa 2',
            'description' => 'Programació Orientada a Objectes',
            'location' => 'Inca',
        ]);

        Empresa::create([
            'title' => 'Empresa 3',
            'description' => 'Màrqueting digital',
            'location' => 'Manacor',
        ]);
    }
}
