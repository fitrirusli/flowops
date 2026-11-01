<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'FlowOps approval API', 'version' => '0.1.0']));
Route::post('/login', [SessionController::class, 'login'])->middleware('throttle:60,1')->name('login');
Route::post('/logout', [SessionController::class, 'logout'])->middleware('auth');
