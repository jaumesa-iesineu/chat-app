<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResultatsAprenentatge;

class RaController extends Controller
{
    public function llistar()
    {
        $moduls = ResultatsAprenentatge::with('ras')->get();
        return response()->json($moduls);
    }
}
