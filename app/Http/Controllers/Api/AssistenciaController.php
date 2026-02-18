<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AssistenciaController extends Controller
{
    public function llistarJornades(Request $request)
    {
        $jornades = Jornada::with(['ras:id,ra,resultat_aprenentatge_codi'])
            ->where('user_id', $request->user()->id)
            ->orderBy('data', 'desc')
            ->orderBy('hora_entrada', 'desc')
            ->get();

        return response()->json($jornades);
    }

    public function crear(Request $request)
    {
        // Verificar que l'usuari sigui alumne
        if ($request->user()->role !== 'alumne') {
            return response()->json([
                'error' => 'Només els alumnes poden registrar jornades'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'data' => 'required|date',
            'hora_entrada' => 'required|date_format:H:i:s',
            'hora_sortida' => 'nullable|date_format:H:i:s',
            'activitats' => 'nullable|string',
            'ra_ids' => 'nullable|array',
            'ra_ids.*' => 'integer|distinct|exists:ras,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validar que hora_sortida sigui posterior a hora_entrada
        if ($request->has('hora_sortida') && $request->hora_sortida) {
            if ($request->hora_sortida <= $request->hora_entrada) {
                return response()->json([
                    'error' => 'L\'hora de sortida ha de ser posterior a l\'hora d\'entrada'
                ], 400);
            }
        }

        $jornada = DB::transaction(function () use ($request) {
            $jornada = Jornada::create([
                'user_id' => $request->user()->id,
                'data' => $request->data,
                'hora_entrada' => $request->hora_entrada,
                'hora_sortida' => $request->hora_sortida,
                'activitats' => $request->activitats,
            ]);

            $jornada->ras()->sync($request->input('ra_ids', []));

            return $jornada->load('ras:id,ra,resultat_aprenentatge_codi');
        });

        return response()->json($jornada, 201);
    }

    public function modificar(Request $request, $id)
    {
        $jornada = Jornada::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$jornada) {
            return response()->json(['error' => 'Jornada no trobada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'hora_sortida' => 'nullable|date_format:H:i:s|after:hora_entrada',
            'activitats' => 'nullable|string',
            'ra_ids' => 'nullable|array',
            'ra_ids.*' => 'integer|distinct|exists:ras,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validar que hora_sortida sigui posterior a hora_entrada
        if ($request->has('hora_sortida') && $request->hora_sortida) {
            if ($request->hora_sortida <= $jornada->hora_entrada) {
                return response()->json([
                    'error' => 'L\'hora de sortida ha de ser posterior a l\'hora d\'entrada'
                ], 400);
            }
        }

        DB::transaction(function () use ($request, $jornada) {
            $jornada->update($request->only(['hora_sortida', 'activitats']));

            if ($request->exists('ra_ids')) {
                $jornada->ras()->sync($request->input('ra_ids', []));
            }
        });

        return response()->json($jornada->load('ras:id,ra,resultat_aprenentatge_codi'));
    }

    public function eliminar(Request $request, $id)
    {
        $jornada = Jornada::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$jornada) {
            return response()->json(['error' => 'Jornada no trobada'], 404);
        }

        $jornada->delete();

        return response()->json(['message' => 'Jornada eliminada correctament']);
    }
}
