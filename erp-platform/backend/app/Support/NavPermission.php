<?php

namespace App\Support;

use App\Models\User;

class NavPermission
{
    /** @var array<string, bool> */
    private const STAFF_DEFAULT = [
        'dashboard' => true,
        'cashier' => true,
        'products' => true,
        'stock' => true,
        'expenses' => true,
        'waste' => true,
        'reports' => true,
        'receipts' => true,
        'owner' => false,
        'users' => false,
        'outlets' => false,
        'suppliers' => false,
    ];

    /** @var array<string, bool> */
    private const MITRA_NAV = [
        'dashboard' => true,
        'cashier' => false,
        'products' => false,
        'stock' => true,
        'expenses' => false,
        'waste' => false,
        'reports' => true,
        'receipts' => false,
        'owner' => false,
        'users' => false,
        'outlets' => false,
        'suppliers' => false,
    ];

    public static function canSee(?User $user, string $feature): bool
    {
        if (! $user) {
            return false;
        }
        if ($user->isOwner()) {
            return true;
        }
        if ($user->isMitra()) {
            return self::MITRA_NAV[$feature] ?? false;
        }
        $overrides = $user->feature_overrides ?? [];
        if (array_key_exists($feature, $overrides)) {
            return (bool) $overrides[$feature];
        }

        return self::STAFF_DEFAULT[$feature] ?? false;
    }

    /** @return list<array{href: string, label: string, feature: string}> */
    public static function navItems(): array
    {
        return [
            ['href' => '/dashboard', 'label' => 'Dashboard', 'feature' => 'dashboard'],
            ['href' => '/cashier', 'label' => 'Kasir', 'feature' => 'cashier'],
            ['href' => '/products', 'label' => 'Produk', 'feature' => 'products'],
            ['href' => '/stock', 'label' => 'Stok', 'feature' => 'stock'],
            ['href' => '/expenses', 'label' => 'Keuangan Shift', 'feature' => 'expenses'],
            ['href' => '/waste', 'label' => 'Waste', 'feature' => 'waste'],
            ['href' => '/reports', 'label' => 'Laporan', 'feature' => 'reports'],
            ['href' => '/receipts', 'label' => 'Struk', 'feature' => 'receipts'],
            ['href' => '/outlets', 'label' => 'Outlet', 'feature' => 'outlets'],
            ['href' => '/owner', 'label' => 'Owner', 'feature' => 'owner'],
            ['href' => '/users', 'label' => 'Pengguna', 'feature' => 'users'],
        ];
    }

    /** @return list<array{href: string, label: string, feature: string}> */
    public static function allowedNavFor(User $user): array
    {
        return array_values(array_filter(
            self::navItems(),
            fn ($item) => self::canSee($user, $item['feature'])
        ));
    }
}
