<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use App\Http\Controllers\EmpresaController;

// Serve index.html as home page
Route::get('/', function () {
    $indexPath = public_path('index.html');
    if (File::exists($indexPath)) {
        return response(File::get($indexPath), 200)
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
    return view('welcome');
})->name('home');

// Serve chat.html
Route::get('/chat.html', function () {
    $chatPath = public_path('chat.html');
    if (File::exists($chatPath)) {
        return response(File::get($chatPath), 200)
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
    abort(404);
})->name('chat');

