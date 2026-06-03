<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['ok' => true, 'time' => now()->toIso8601String()]));

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/sync/catalog', function (Request $request) {
            $outletId = $request->header('X-Outlet-Id') ?? $request->session()->get('outlet_id');
            if (! $outletId) {
                return response()->json(['error' => 'Outlet required'], 400);
            }
            $products = \App\Models\Product::query()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'category', 'price']);

            return response()->json([
                'outletId' => $outletId,
                'products' => $products,
                'cachedAt' => now()->toIso8601String(),
            ]);
        });

        Route::post('/sync/sales', function () {
            return response()->json(['queued' => 0, 'message' => 'Sync penjualan — implementasi Fase 4']);
        });
    });
});
