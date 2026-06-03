<?php

namespace App\Http\Controllers;

use App\Services\SupplierService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $supplierService) {}

    public function index()
    {
        $suppliers = $this->supplierService->listSuppliers();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|string',
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $this->supplierService->upsertSupplier($data);

        return redirect()->back()->with('success', 'Supplier berhasil disimpan.');
    }

    public function destroy(string $id)
    {
        $this->supplierService->deleteSupplier($id);

        return redirect()->back()->with('success', 'Supplier berhasil dihapus.');
    }
}
