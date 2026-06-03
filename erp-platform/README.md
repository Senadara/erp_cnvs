# ERP Platform (Laravel + PWA)

Aplikasi produksi **baru** untuk menggantikan deploy Next.js di cPanel.

## Struktur monorepo

```text
erp_cnvs/                    ← root git (satu repo)
├── app/                     ← LEGACY Next.js (jangan campur kode Laravel di sini)
├── prisma/                  ← skema referensi (legacy)
├── components/              ← referensi UI Next
├── DEPLOY-CPANEL.md         ← deploy Next (arsip)
├── BLUEPRINT-APLIKASI-LENGKAP.md
└── erp-platform/            ← produk baru
    ├── README.md            ← file ini
    └── backend/             ← Laravel 12 + Inertia React + PWA
```

## Menjalankan Laravel (lokal)

```bash
cd erp-platform/backend
cp .env.example .env
php artisan key:generate
# set DB_* di .env
composer install
npm install
npm run build
php artisan migrate --seed
php artisan serve
```

Buka http://127.0.0.1:8000

## Deploy

Lihat `erp-platform/backend/DEPLOY-LARAVEL-CPANEL.md`

## Aturan repo

- **Jangan** menaruh `vendor/`, `node_modules` Laravel di root Next.
- **Jangan** mengedit `erp-platform/backend` dari script postinstall Next.
- Perubahan bisnis: port dari `lib/actions/*` → `backend/app/Services/*`.
