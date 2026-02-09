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

        // Crear profesor
        $profesor = User::create([
            'name' => 'María García',
            'email' => 'profesor@example.com',
            'password' => Hash::make('password123'),
            'role' => 'profesor',
        ]);

        // Crear alumno
        $alumno = User::create([
            'name' => 'Juan López',
            'email' => 'alumno@example.com',
            'password' => Hash::make('password123'),
            'role' => 'alumno',
        ]);

        // Crear empresario
        $empresario = User::create([
            'name' => 'Carlos Martínez',
            'email' => 'empresario@example.com',
            'password' => Hash::make('password123'),
            'role' => 'empresario',
        ]);

        // Asignar usuarios al contrato
        $contract->users()->attach([$profesor->id, $alumno->id, $empresario->id]);

        echo "✅ Contrato creado: {$contract->name}\n";
        echo "✅ 3 usuarios asignados al contrato: profesor, alumno y empresario\n";
        echo "Credenciales para todos: password123\n";
    }
}
