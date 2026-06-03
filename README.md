# ERP Canvas — monorepo

| Folder | Stack | Status |
|--------|--------|--------|
| **`/`** (app, components, lib) | Next.js 16 + Prisma | Legacy / referensi UI |
| **`erp-platform/backend/`** | Laravel 12 + Inertia React + PWA | **Produksi (cPanel)** |

## Produksi (cPanel, tanpa VPS)

Gunakan **Laravel**:

```bash
cd erp-platform/backend
```

Panduan: [erp-platform/README.md](erp-platform/README.md) · [DEPLOY-LARAVEL-CPANEL.md](erp-platform/backend/DEPLOY-LARAVEL-CPANEL.md)

Blueprint lengkap: [BLUEPRINT-APLIKASI-LENGKAP.md](BLUEPRINT-APLIKASI-LENGKAP.md)

## Legacy Next (lokal saja)

```bash
npm install
npm run dev
```

Deploy Next: [DEPLOY-CPANEL.md](DEPLOY-CPANEL.md) — tidak disarankan di shared hosting ketat.
