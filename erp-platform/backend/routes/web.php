<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ModulePageController;
use App\Http\Controllers\OutletSessionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth', 'outlet'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::post('/outlet', [OutletSessionController::class, 'store'])->name('outlet.set');

    // Display Groups
    Route::post('/display-groups', [\App\Http\Controllers\DisplayGroupController::class, 'store'])->name('display-groups.store');
    Route::delete('/display-groups/{id}', [\App\Http\Controllers\DisplayGroupController::class, 'destroy'])->name('display-groups.destroy');

    // Products
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products');
    Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
    Route::delete('/products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy');
    Route::post('/products/{id}/conversions', [\App\Http\Controllers\ProductController::class, 'setConversions'])->name('products.conversions');

    // Stock
    Route::get('/stock', [\App\Http\Controllers\StockController::class, 'index'])->name('stock');
    Route::post('/stock', [\App\Http\Controllers\StockController::class, 'store'])->name('stock.store');
    Route::delete('/stock/{id}', [\App\Http\Controllers\StockController::class, 'destroy'])->name('stock.destroy');
    Route::post('/stock/{id}/add', [\App\Http\Controllers\StockController::class, 'addStock'])->name('stock.add');
    Route::post('/stock/{id}/waste', [\App\Http\Controllers\StockController::class, 'recordWaste'])->name('stock.waste');

    $modules = ['cashier', 'expenses', 'waste', 'reports', 'receipts', 'outlets', 'owner', 'users'];
    foreach ($modules as $module) {
        Route::get('/'.$module, function (\Illuminate\Http\Request $request) use ($module) {
            return app(\App\Http\Controllers\ModulePageController::class)->show($request, $module);
        })->name($module);
    }

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

require __DIR__.'/auth.php';
