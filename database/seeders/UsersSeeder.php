<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Contract;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear contrato
        $contract = Contract::create([
            'name' => 'Pràctiques IES Sineu',
        ]);

        // Crear professor
        $professor = User::create([
            'name' => 'María García',
            'email' => 'professor@example.com',
            'password' => Hash::make('password123'),
            'role' => 'professor',
        ]);

        // Crear alumne
        $alumne = User::create([
            'name' => 'Juan López',
            'email' => 'alumne@example.com',
            'password' => Hash::make('password123'),
            'role' => 'alumne',
        ]);

        // Crear empresari
        $empresari = User::create([
            'name' => 'Carlos Martínez',
            'email' => 'empresari@example.com',
            'password' => Hash::make('password123'),
            'role' => 'empresari',
        ]);

        // Asignar usuarios al contrato
        $contract->users()->attach([$professor->id, $alumne->id, $empresari->id]);

        echo "✅ Contrato creado: {$contract->name}\n";
        echo "✅ 3 usuarios asignados al contrato: professor, alumne y empresari\n";
        echo "Credenciales para todos: password123\n";
    }
}
