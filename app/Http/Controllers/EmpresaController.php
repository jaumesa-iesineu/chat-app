<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Empresa;

class EmpresaController extends Controller
{
    /**
     * Llista les empreses.
     * Si l'usuari és alumne, només retorna la seva empresa assignada.
     * Professors i empresaris veuen totes.
     */
    public function llistar_empreses(Request $request)
    {
        $usuari = $request->user();

        if ($usuari->alumne) {
            $empreses = collect([]);
        } else {
            $empreses = Empresa::all();
        }

        return response()->json($empreses);
    }

    public function obtenir_detalls($id)
    {
        $empresa = Empresa::find($id);

        if (!$empresa) {
            return response()->json(['error' => 'Empresa no trobada'], 404);
        }

        return response()->json($empresa);
    }
}
