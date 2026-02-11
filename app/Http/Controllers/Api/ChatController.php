<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Contract;
use Illuminate\Http\Request;
use Musonza\Chat\Facades\ChatFacade as Chat;

class ChatController extends Controller
{
    /**
     * Obtener todas las conversaciones del usuario con conteo de no leídos
     * Incluye grupos automáticos de contratos
     */
    public function conversations(Request $request)
    {
        // Asegurar que existen los grupos de contrato
        $this->ensureContractGroups($request->user());

        $conversations = Chat::conversations()
            ->setParticipant($request->user())
            ->get();

        $conversationsArray = $conversations->toArray()['data'] ?? [];

        // Añadir conteo de mensajes no leídos y último mensaje a cada conversación
        foreach ($conversationsArray as &$conv) {
            $conversation = Chat::conversations()->getById($conv['conversation_id']);
            $unreadCount = Chat::conversation($conversation)
                ->setParticipant($request->user())
                ->unreadCount();
            $conv['unread_count'] = $unreadCount;

            // Último mensaje
            $lastMessage = Chat::conversation($conversation)
                ->setParticipant($request->user())
                ->getMessages();
            $lastMessageData = is_array($lastMessage) ? $lastMessage : $lastMessage->toArray();
            $messages = $lastMessageData['data'] ?? $lastMessageData;
            if (!empty($messages)) {
                $last = end($messages);
                $conv['last_message'] = [
                    'body' => $last['body'] ?? '',
                    'sender_name' => $last['sender']['name'] ?? '',
                    'created_at' => $last['created_at'] ?? '',
                ];
            } else {
                $conv['last_message'] = null;
            }
        }

        return response()->json([
            'conversations' => $conversationsArray,
        ]);
    }

    /**
     * Crear una conversación privada (1-a-1) o obtener la existente
     */
    public function createPrivateConversation(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $otherUser = User::find($request->user_id);

        // Buscar conversación existente entre estos dos usuarios
        $existingConversation = Chat::conversations()
            ->setParticipant($request->user())
            ->get()
            ->filter(function($participation) use ($otherUser, $request) {
                $conv = $participation->conversation;
                // Solo conversaciones privadas
                if (!$conv->private) return false;

                // Obtener IDs de participantes
                $participantIds = $conv->participants->pluck('messageable_id')->sort()->values();
                $targetIds = collect([$request->user()->id, $otherUser->id])->sort()->values();

                return $participantIds->toArray() === $targetIds->toArray();
            })
            ->first();

        if ($existingConversation) {
            return response()->json([
                'conversation' => $existingConversation->conversation,
                'message' => 'Conversación existente',
                'existing' => true
            ]);
        }

        // Crear nueva conversación privada
        $conversation = Chat::createConversation([
            $request->user(),
            $otherUser
        ])->makePrivate();

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Conversación creada',
            'existing' => false
        ], 201);
    }

    /**
     * Crear un grupo
     */
    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $users = User::whereIn('id', $request->user_ids)->get()->toArray();
        $participants = array_merge($users, [$request->user()]);

        $conversation = Chat::createConversation($participants);

        $conversation->name = $request->name;
        $conversation->save();

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Grupo creado',
        ], 201);
    }

    /**
     * Enviar un mensaje
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'message' => 'nullable|string|max:5000',
            'file' => 'nullable|file|mimes:jpeg,jpg,png,gif,mp4,mov,avi,webm|max:51200', // 50MB max
        ]);

        $conversation = Chat::conversations()->getById($conversationId);

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversación no encontrada',
            ], 404);
        }

        // Procesar archivo si existe
        $fileData = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('chat_files', $filename, 'public');

            $fileData = [
                'filename' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'url' => asset('storage/' . $path),
            ];
        }

        // El mensaje es opcional si hay un archivo
        $messageText = $request->message ?? '';

        // Musonza\Chat requereix un cos de missatge no buit per enviar. Si
        // no hi ha cap missatge però s'ha pujat un fitxer, assignem un
        // marcador mínim perquè la llibreria accepti l'enviament. El
        // marcador és discret i els clients el poden interpretar al
        // renderitzar.
        if (strlen(trim((string) $messageText)) === 0 && $fileData) {
            // Fem servir un espai d'amplada zero (U+200B) perquè la
            // llibreria detecti un cos no buit però els clients no
            // mostraran text visible. També s'establirà el tipus de
            // missatge a 'file' perquè el frontend renderitzi l'adjunt.
            $messageText = "\u{200B}";
        }

        $messageBuilder = Chat::message($messageText)
            ->from($request->user())
            ->to($conversation)
            ->data($fileData ?? []);

        if ($fileData) {
            $messageBuilder = $messageBuilder->type('file');
        }

        $message = $messageBuilder->send();

        return response()->json([
            'message' => $message,
        ], 201);
    }

    /**
     * Obtener mensajes de una conversación
     */
    public function getMessages(Request $request, $conversationId)
    {
        $conversation = Chat::conversations()->getById($conversationId);

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversación no encontrada',
            ], 404);
        }

        $messages = Chat::conversation($conversation)
            ->setParticipant($request->user())
            ->getMessages();

        // Marcar mensajes como leídos
        Chat::conversation($conversation)
            ->setParticipant($request->user())
            ->readAll();

        $messagesData = is_array($messages) ? $messages : $messages->toArray();

        return response()->json([
            'messages' => $messagesData['data'] ?? $messagesData,
        ]);
    }

    /**
     * Obtener participantes de una conversación
     */
    public function getParticipants(Request $request, $conversationId)
    {
        $conversation = Chat::conversations()->getById($conversationId);

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversación no encontrada',
            ], 404);
        }

        $participants = $conversation->participants;

        return response()->json([
            'participants' => $participants,
        ]);
    }

    /**
     * Asegurar que existen grupos automáticos para todos los contratos del usuario
     */
    private function ensureContractGroups(User $user)
    {
        $contracts = $user->contracts;

        foreach ($contracts as $contract) {
            // Obtener todos los usuarios del contrato
            $contractUsers = $contract->users;

            // Buscar si ya existe un grupo para este contrato
            $existingGroup = Chat::conversations()
                ->setParticipant($user)
                ->get()
                ->first(function($participation) use ($contract, $contractUsers) {
                    $conv = $participation->conversation;

                    // Debe ser grupo (no privado)
                    if ($conv->private) return false;

                    // El nombre debe coincidir con el contrato
                    if ($conv->name !== $contract->name) return false;

                    // Los participantes deben coincidir exactamente
                    $participantIds = $conv->participants->pluck('messageable_id')->sort()->values();
                    $contractUserIds = $contractUsers->pluck('id')->sort()->values();

                    return $participantIds->toArray() === $contractUserIds->toArray();
                });

            // Si no existe, crear el grupo
            if (!$existingGroup) {
                $conversation = Chat::createConversation($contractUsers->all());
                $conversation->private = false;
                $conversation->name = $contract->name;
                $conversation->save();
            }
        }
    }
}
