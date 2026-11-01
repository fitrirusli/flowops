<?php

use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/demo', [SessionController::class, 'demo'])->middleware('throttle:60,1');
    Route::middleware(['auth:sanctum', 'throttle:180,1'])->group(function () {
        Route::get('/me', [SessionController::class, 'me']);
        Route::prefix('organizations/{organization}')->whereUuid('organization')->group(function () {
            Route::get('/overview', [WorkspaceController::class, 'overview']);
            Route::get('/policy', [WorkspaceController::class, 'policy']);
            Route::post('/policy/publish', [WorkspaceController::class, 'publish']);
            Route::get('/audit-events', [WorkspaceController::class, 'audit']);
            Route::get('/members', [WorkspaceController::class, 'members']);
            Route::get('/requests', [PurchaseRequestController::class, 'index']);
            Route::post('/requests', [PurchaseRequestController::class, 'store']);
            Route::prefix('requests/{purchaseRequest}')->whereUuid('purchaseRequest')->group(function () {
                Route::get('/', [PurchaseRequestController::class, 'show']);
                Route::patch('/', [PurchaseRequestController::class, 'update']);
                Route::post('/submit', [PurchaseRequestController::class, 'submit']);
                Route::post('/cancel', [PurchaseRequestController::class, 'cancel']);
                Route::post('/copy', [PurchaseRequestController::class, 'copy']);
                Route::post('/steps/{step}/{action}', [PurchaseRequestController::class, 'decide'])->whereUuid('step')->whereIn('action', ['approve', 'reject']);
            });
        });
    });
});
