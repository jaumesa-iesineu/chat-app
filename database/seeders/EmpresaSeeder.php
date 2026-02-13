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
            'title' => 'Tech Balears',
            'description' => 'Empresa de desenvolupament de software',
            'location' => 'Palma',
        ]);

        Empresa::create([
            'title' => 'Serveis Insulars',
            'description' => 'Consultoria i serveis empresarials',
            'location' => 'Inca',
        ]);

        Empresa::create([
            'title' => 'Mediterrani Digital',
            'description' => 'Agència de màrqueting digital',
            'location' => 'Manacor',
        ]);
    }
}
