<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login y obtener token de acceso
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        $token = $user->createToken('chat-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Obtener usuario autenticado
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Listar usuarios del mismo contrato
     */
    public function users(Request $request)
    {
        $currentUser = $request->user();

        // Obtener IDs de contratos del usuario actual
        $contractIds = $currentUser->contracts()->pluck('contracts.id');

        // Obtener usuarios que comparten algún contrato (excepto el usuario actual)
        $users = User::whereHas('contracts', function($query) use ($contractIds) {
            $query->whereIn('contracts.id', $contractIds);
        })
        ->where('id', '!=', $currentUser->id)
        ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Logout y revocar token
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout exitoso',
        ]);
    }
}
