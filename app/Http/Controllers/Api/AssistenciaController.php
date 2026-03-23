<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AssistenciaController extends Controller
{
    private function obtenirJornadaProfessor(Request $request, int $jornadaId): ?Jornada
    {
        $usuari = $request->user();
        if ($usuari->role !== 'professor') {
            return null;
        }

        $contractesIds = $usuari->contracts()->pluck('contracts.id');

        return Jornada::query()
            ->where('id', $jornadaId)
            ->whereHas('user', function ($query) use ($contractesIds) {
                $query->whereHas('alumne')
                    ->whereHas('contracts', fn ($subQuery) => $subQuery->whereIn('contracts.id', $contractesIds));
            })
            ->first();
    }

    /**
     * Retorna jornades d'un alumne assignat al professor.
     */
    public function llistarJornadesAlumneProfessor(Request $request, $alumneId)
    {
        $usuari = $request->user();

        if ($usuari->role !== 'professor') {
            return response()->json(['error' => 'Només els professors poden accedir'], 403);
        }

        $contractesIds = $usuari->contracts()->pluck('contracts.id');
        $alumne = User::query()
            ->select(['users.id', 'users.name', 'users.email'])
            ->whereHas('alumne')
            ->whereHas('contracts', fn ($query) => $query->whereIn('contracts.id', $contractesIds))
            ->find($alumneId);

        if (!$alumne) {
            return response()->json(['error' => 'Alumne no trobat o no assignat'], 404);
        }

        $jornades = Jornada::query()
            ->with(['ras:id,ra,resultat_aprenentatge_codi'])
            ->where('user_id', $alumne->id)
            ->orderBy('data', 'desc')
            ->orderBy('hora_entrada', 'desc')
            ->get();

        return response()->json([
            'alumne' => $alumne,
            'jornades' => $jornades,
        ]);
    }

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
        if (!$request->user()->alumne) {
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

    public function modificarProfessor(Request $request, $id)
    {
        $jornada = $this->obtenirJornadaProfessor($request, (int) $id);
        if (!$jornada) {
            return response()->json(['error' => 'Jornada no trobada o no assignada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'hora_sortida' => 'nullable|date_format:H:i:s',
            'activitats' => 'nullable|string',
            'ra_ids' => 'nullable|array',
            'ra_ids.*' => 'integer|distinct|exists:ras,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

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

    public function eliminarProfessor(Request $request, $id)
    {
        $jornada = $this->obtenirJornadaProfessor($request, (int) $id);
        if (!$jornada) {
            return response()->json(['error' => 'Jornada no trobada o no assignada'], 404);
        }

        $jornada->delete();

        return response()->json(['message' => 'Jornada eliminada correctament']);
    }
}
