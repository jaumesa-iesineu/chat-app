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
}
