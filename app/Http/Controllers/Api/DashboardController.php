<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    private const OBJECTIU_HORES = 200;
    private const DIES_ACTIU = 7;

    public function resum(Request $request)
    {
        $usuari = $request->user()->loadMissing('contracts:id,name');
        $rolUsuari = strtolower((string) $usuari->role);
        $jornadesPropies = Jornada::query()
            ->withCount('ras')
            ->where('user_id', $usuari->id)
            ->orderBy('data', 'desc')
            ->orderBy('hora_entrada', 'desc')
            ->get();

        $resumPropi = $this->resumDesDeJornades($jornadesPropies);
        $resposta = [
            'role' => $rolUsuari,
            'objective_hours' => self::OBJECTIU_HORES,
            'contracts' => $usuari->contracts->pluck('name')->values(),
            'own_summary' => $resumPropi,
            'assigned_students' => [],
            'students_summary' => $this->resumAlumnesBuit(),
        ];

        if (!in_array($rolUsuari, ['professor', 'empresari'], true)) {
            return response()->json($resposta);
        }

        $contractesIds = $usuari->contracts->pluck('id')->all();
        if (count($contractesIds) === 0) {
            return response()->json($resposta);
        }

        $alumnes = User::query()
            ->select(['users.id', 'users.name', 'users.email', 'users.role'])
            ->where('users.role', 'alumne')
            ->whereHas('contracts', function ($query) use ($contractesIds) {
                $query->whereIn('contracts.id', $contractesIds);
            })
            ->with(['contracts:id,name'])
            ->orderBy('users.name')
            ->get();

        if ($alumnes->isEmpty()) {
            return response()->json($resposta);
        }

        $jornadesAlumnes = Jornada::query()
            ->withCount('ras')
            ->whereIn('user_id', $alumnes->pluck('id'))
            ->orderBy('data', 'desc')
            ->orderBy('hora_entrada', 'desc')
            ->get()
            ->groupBy('user_id');

        $alumnesResum = [];
        foreach ($alumnes as $alumne) {
            $jornadesAlumne = $jornadesAlumnes->get($alumne->id, collect());
            $resumAlumne = $this->resumDesDeJornades($jornadesAlumne);
            $contractesAssignats = $alumne->contracts
                ->whereIn('id', $contractesIds)
                ->pluck('name')
                ->values();

            $alumnesResum[] = [
                'id' => $alumne->id,
                'name' => $alumne->name,
                'email' => $alumne->email,
                'assigned_contracts' => $contractesAssignats,
                'summary' => [
                    ...$resumAlumne,
                    'is_active_recently' => $this->esActiuRecentment($resumAlumne['last_jornada_date']),
                    'has_open_shift_today' => $this->teJornadaObertaAvui($jornadesAlumne),
                ],
            ];
        }

        $resposta['assigned_students'] = $alumnesResum;
        $resposta['students_summary'] = $this->resumGlobalAlumnes($alumnesResum);

        return response()->json($resposta);
    }

    private function resumDesDeJornades(Collection $jornades): array
    {
        $totalMinuts = 0.0;
        $completes = 0;
        $pendents = 0;
        $darreraData = null;

        foreach ($jornades as $jornada) {
            $minuts = $this->calcularMinutsJornada($jornada);
            if ($minuts > 0) {
                $totalMinuts += $minuts;
            }

            if ($this->esJornadaCompleta($jornada)) {
                $completes++;
            } else {
                $pendents++;
            }

            $dataJornada = $this->normalitzarData($jornada->data ?? null);
            if ($dataJornada !== null && ($darreraData === null || $dataJornada > $darreraData)) {
                $darreraData = $dataJornada;
            }
        }

        $horesTotals = round($totalMinuts / 60, 1);
        $horesRestants = max(0, round(self::OBJECTIU_HORES - $horesTotals, 1));
        $progres = min(100, round(($horesTotals / self::OBJECTIU_HORES) * 100, 1));

        return [
            'total_jornades' => $jornades->count(),
            'completed_jornades' => $completes,
            'pending_jornades' => $pendents,
            'hours_done' => $horesTotals,
            'hours_remaining' => $horesRestants,
            'progress_percentage' => $progres,
            'last_jornada_date' => $darreraData,
        ];
    }

    private function resumAlumnesBuit(): array
    {
        return [
            'total_assigned' => 0,
            'active_recently' => 0,
            'with_pending_jornades' => 0,
            'completed_target' => 0,
            'with_open_shift_today' => 0,
            'average_progress_percentage' => 0,
            'total_hours_done' => 0,
            'total_hours_remaining' => 0,
        ];
    }

    private function resumGlobalAlumnes(array $alumnesResum): array
    {
        if (count($alumnesResum) === 0) {
            return $this->resumAlumnesBuit();
        }

        $actius = 0;
        $ambPendents = 0;
        $objectiuCompletat = 0;
        $jornadaObertaAvui = 0;
        $horesTotals = 0.0;
        $horesRestantsTotals = 0.0;
        $progresAcumulat = 0.0;

        foreach ($alumnesResum as $alumne) {
            $resum = $alumne['summary'] ?? [];
            $horesTotals += (float) ($resum['hours_done'] ?? 0);
            $horesRestantsTotals += (float) ($resum['hours_remaining'] ?? 0);
            $progresAcumulat += (float) ($resum['progress_percentage'] ?? 0);

            if (!empty($resum['is_active_recently'])) {
                $actius++;
            }
            if (($resum['pending_jornades'] ?? 0) > 0) {
                $ambPendents++;
            }
            if (($resum['hours_done'] ?? 0) >= self::OBJECTIU_HORES) {
                $objectiuCompletat++;
            }
            if (!empty($resum['has_open_shift_today'])) {
                $jornadaObertaAvui++;
            }
        }

        return [
            'total_assigned' => count($alumnesResum),
            'active_recently' => $actius,
            'with_pending_jornades' => $ambPendents,
            'completed_target' => $objectiuCompletat,
            'with_open_shift_today' => $jornadaObertaAvui,
            'average_progress_percentage' => round($progresAcumulat / count($alumnesResum), 1),
            'total_hours_done' => round($horesTotals, 1),
            'total_hours_remaining' => round($horesRestantsTotals, 1),
        ];
    }

    private function esJornadaCompleta($jornada): bool
    {
        $teSortida = !empty($jornada->hora_sortida);
        $teActivitats = is_string($jornada->activitats ?? null)
            ? trim($jornada->activitats) !== ''
            : !empty($jornada->activitats);
        $teRa = (int) ($jornada->ras_count ?? 0) > 0;

        return $teSortida && $teActivitats && $teRa;
    }

    private function calcularMinutsJornada($jornada): float
    {
        $entrada = $this->horaAMinuts($jornada->hora_entrada ?? null);
        $sortida = $this->horaAMinuts($jornada->hora_sortida ?? null);

        if ($entrada === null || $sortida === null || $sortida <= $entrada) {
            return 0.0;
        }

        return $sortida - $entrada;
    }

    private function horaAMinuts(?string $hora): ?float
    {
        if (!is_string($hora) || trim($hora) === '') {
            return null;
        }

        $horaNeta = trim($hora);
        if (!preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/', $horaNeta, $matches)) {
            return null;
        }

        $hores = (int) $matches[1];
        $minuts = (int) $matches[2];
        $segons = isset($matches[3]) ? (float) $matches[3] : 0.0;

        if ($hores < 0 || $hores > 23 || $minuts < 0 || $minuts > 59 || $segons < 0 || $segons >= 60) {
            return null;
        }

        return ($hores * 60) + $minuts + ($segons / 60);
    }

    private function normalitzarData($data): ?string
    {
        if ($data instanceof \DateTimeInterface) {
            return $data->format('Y-m-d');
        }

        if (!is_string($data) || trim($data) === '') {
            return null;
        }

        try {
            return (new \DateTimeImmutable($data))->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    private function esActiuRecentment(?string $darreraData): bool
    {
        if ($darreraData === null) {
            return false;
        }

        try {
            $limit = (new \DateTimeImmutable('today'))->modify('-' . self::DIES_ACTIU . ' days');
            $data = new \DateTimeImmutable($darreraData);

            return $data >= $limit;
        } catch (\Throwable) {
            return false;
        }
    }

    private function teJornadaObertaAvui(Collection $jornades): bool
    {
        $avui = (new \DateTimeImmutable('today'))->format('Y-m-d');

        foreach ($jornades as $jornada) {
            $dataJornada = $this->normalitzarData($jornada->data ?? null);
            if ($dataJornada === $avui && empty($jornada->hora_sortida)) {
                return true;
            }
        }

        return false;
    }
}
