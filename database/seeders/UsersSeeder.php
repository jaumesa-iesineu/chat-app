<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Professor;
use App\Models\Alumne;
use App\Models\Empresari;
use App\Models\Contract;
use App\Models\Empresa;
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
        ]);
        Professor::create([
            'user_id' => $professor->id,
            'curs' => 'DAW 2n',
        ]);

        // Obtenir la primera empresa per assignar-la
        $empresa = Empresa::first();

        // Crear alumne
        $alumne = User::create([
            'name' => 'Juan López',
            'email' => 'alumne@example.com',
            'password' => Hash::make('password123'),
        ]);
        Alumne::create([
            'user_id' => $alumne->id,
            'numero_seguretat_social' => '123456789012',
        ]);

        // Crear empresari
        $empresariUser = User::create([
            'name' => 'Carlos Martínez',
            'email' => 'empresari@example.com',
            'password' => Hash::make('password123'),
        ]);
        if ($empresa) {
            Empresari::create([
                'user_id' => $empresariUser->id,
                'empresa_id' => $empresa->id,
            ]);
        }

        // Asignar usuarios al contrato
        $contract->users()->attach([$professor->id, $alumne->id, $empresariUser->id]);

        echo "✅ Contrato creado: {$contract->name}\n";
        echo "✅ 3 usuarios asignados al contrato: professor, alumne y empresari\n";
        echo "Credenciales para todos: password123\n";
    }
}
