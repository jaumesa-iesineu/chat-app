<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use App\Models\Ra;
use App\Models\ResultatsAprenentatge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RaController extends Controller
{
    public function llistar()
    {
        $moduls = ResultatsAprenentatge::with('ras')->get();
        return response()->json($moduls);
    }

    /**
     * Retorna els alumnes assignats al professor (mateixos contractes).
     */
    public function alumnesAssignats(Request $request)
    {
        $usuari = $request->user();

        if ($usuari->role !== 'professor') {
            return response()->json(['error' => 'Només els professors poden accedir'], 403);
        }

        $contractesIds = $usuari->contracts()->pluck('contracts.id');

        $alumnes = User::query()
            ->select(['users.id', 'users.name', 'users.email'])
            ->whereHas('alumne')
            ->whereHas('contracts', function ($query) use ($contractesIds) {
                $query->whereIn('contracts.id', $contractesIds);
            })
            ->orderBy('users.name')
            ->get();

        return response()->json($alumnes);
    }

    /**
     * Retorna les RA's d'un alumne, amb informació de quines jornades les van marcar.
     */
    public function rasAlumne(Request $request, $alumneId)
    {
        $usuari = $request->user();

        if ($usuari->role !== 'professor') {
            return response()->json(['error' => 'Només els professors poden accedir'], 403);
        }

        // Verificar que l'alumne està als mateixos contractes
        $contractesIds = $usuari->contracts()->pluck('contracts.id');
        $alumne = User::query()
            ->whereHas('alumne')
            ->whereHas('contracts', fn ($q) => $q->whereIn('contracts.id', $contractesIds))
            ->find($alumneId);

        if (!$alumne) {
            return response()->json(['error' => 'Alumne no trobat o no assignat'], 404);
        }

        // Obtenir totes les jornades de l'alumne amb les RA's
        $jornades = Jornada::query()
            ->where('user_id', $alumneId)
            ->with('ras:id,ra,resultat_aprenentatge_codi')
            ->orderBy('data', 'desc')
            ->get();

        // Construir mapa: ra_id => [{data, activitats}]
        $raJornades = [];
        foreach ($jornades as $jornada) {
            foreach ($jornada->ras as $ra) {
                $raJornades[$ra->id][] = [
                    'jornada_id' => $jornada->id,
                    'data' => $jornada->data->format('Y-m-d'),
                    'activitats' => $jornada->activitats,
                ];
            }
        }

        // Obtenir tots els mòduls amb RA's
        $moduls = ResultatsAprenentatge::with('ras')->get();

        // Enriquir cada RA amb la info de jornades
        $resultat = $moduls->map(function ($modul) use ($raJornades) {
            return [
                'codi' => $modul->codi,
                'modul' => $modul->modul,
                'ras' => $modul->ras->map(function ($ra) use ($raJornades) {
                    return [
                        'id' => $ra->id,
                        'ra' => $ra->ra,
                        'descripcio' => $ra->descripcio,
                        'resultat_aprenentatge_codi' => $ra->resultat_aprenentatge_codi,
                        'completat' => isset($raJornades[$ra->id]),
                        'jornades' => $raJornades[$ra->id] ?? [],
                    ];
                }),
            ];
        });

        return response()->json([
            'alumne' => ['id' => $alumne->id, 'name' => $alumne->name, 'email' => $alumne->email],
            'moduls' => $resultat,
        ]);
    }

    /**
     * Afegeix una RA a un alumne creant una jornada especial del professor.
     */
    public function afegirRaAlumne(Request $request, $alumneId)
    {
        $usuari = $request->user();

        if ($usuari->role !== 'professor') {
            return response()->json(['error' => 'Només els professors poden fer això'], 403);
        }

        $validator = Validator::make($request->all(), [
            'ra_id' => 'required|integer|exists:ras,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar que l'alumne està assignat
        $contractesIds = $usuari->contracts()->pluck('contracts.id');
        $alumne = User::query()
            ->whereHas('alumne')
            ->whereHas('contracts', fn ($q) => $q->whereIn('contracts.id', $contractesIds))
            ->find($alumneId);

        if (!$alumne) {
            return response()->json(['error' => 'Alumne no trobat o no assignat'], 404);
        }

        $raId = $request->input('ra_id');

        // Verificar que l'alumne no la té ja
        $jaExisteix = Jornada::query()
            ->where('user_id', $alumneId)
            ->whereHas('ras', fn ($q) => $q->where('ras.id', $raId))
            ->exists();

        if ($jaExisteix) {
            return response()->json(['error' => 'L\'alumne ja té aquesta RA assignada'], 409);
        }

        // Crear una jornada administrativa per associar la RA
        $jornada = DB::transaction(function () use ($alumneId, $raId, $usuari) {
            $jornada = Jornada::create([
                'user_id' => $alumneId,
                'data' => now()->toDateString(),
                'hora_entrada' => '00:00:00',
                'hora_sortida' => '00:00:00',
                'activitats' => 'RA afegida pel professor ' . $usuari->name,
            ]);
            $jornada->ras()->attach($raId);
            return $jornada;
        });

        return response()->json(['message' => 'RA afegida correctament'], 201);
    }

    /**
     * Treu una RA d'un alumne (desvincula de totes les jornades).
     */
    public function treureRaAlumne(Request $request, $alumneId, $raId)
    {
        $usuari = $request->user();

        if ($usuari->role !== 'professor') {
            return response()->json(['error' => 'Només els professors poden fer això'], 403);
        }

        // Verificar que l'alumne està assignat
        $contractesIds = $usuari->contracts()->pluck('contracts.id');
        $alumne = User::query()
            ->whereHas('alumne')
            ->whereHas('contracts', fn ($q) => $q->whereIn('contracts.id', $contractesIds))
            ->find($alumneId);

        if (!$alumne) {
            return response()->json(['error' => 'Alumne no trobat o no assignat'], 404);
        }

        // Treure la RA de totes les jornades de l'alumne
        $jornadesIds = Jornada::where('user_id', $alumneId)->pluck('id');
        DB::table('jornada_ra')
            ->whereIn('jornada_id', $jornadesIds)
            ->where('ra_id', $raId)
            ->delete();

        return response()->json(['message' => 'RA treta correctament']);
    }
}
