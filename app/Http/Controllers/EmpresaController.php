<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Empresa;

class EmpresaController extends Controller
{
    public function llistar_empreses()
    {
        $empreses = Empresa::all();
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
