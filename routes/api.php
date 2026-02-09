<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/users', [AuthController::class, 'users']);

    // Chat
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::post('/conversations/private', [ChatController::class, 'createPrivateConversation']);
    Route::post('/conversations/group', [ChatController::class, 'createGroup']);
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'getMessages']);
    Route::post('/conversations/{conversationId}/messages', [ChatController::class, 'sendMessage']);
    Route::get('/conversations/{conversationId}/participants', [ChatController::class, 'getParticipants']);
});
