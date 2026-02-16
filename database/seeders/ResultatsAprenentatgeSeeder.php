<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ResultatsAprenentatge;

class ResultatsAprenentatgeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ResultatsAprenentatge::create(['codi' => 'RA1', 'modul' => 'Programació']);
        ResultatsAprenentatge::create(['codi' => 'RA2', 'modul' => 'Bases de Dades']);
        ResultatsAprenentatge::create(['codi' => 'RA3', 'modul' => 'Desenvolupament Web']);
    }
}
