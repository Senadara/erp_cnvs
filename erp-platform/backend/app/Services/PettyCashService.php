<?php

namespace App\Services;

use App\Models\PettyCash;
use Carbon\Carbon;

class PettyCashService
{
    public function listExpenses(string $outletId, int $limit = 100)
    {
        return PettyCash::where('outlet_id', $outletId)
            ->orderByDesc('created_at')
            ->take($limit)
            ->get();
    }

    public function createExpense(array $data)
    {
        return PettyCash::create([
            'outlet_id' => $data['outlet_id'],
            'amount' => $data['amount'],
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'created_at' => Carbon::now(),
        ]);
    }

    public function deleteExpense(string $id, string $outletId)
    {
        $expense = PettyCash::where('id', $id)->where('outlet_id', $outletId)->firstOrFail();
        return $expense->delete();
    }
}
