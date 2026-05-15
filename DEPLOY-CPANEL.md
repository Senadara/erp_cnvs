# Deploy ERP ke cPanel (GitHub → Pull → Build → Run)

Panduan untuk hosting **CloudLinux + Node.js Selector** dengan clone/pull dari **GitHub**.

Aplikasi dijalankan lewat **`server.js`** atau **`app.js`** (keduanya setara).

---

## Ringkasan alur

```text
GitHub repo
    ↓  (clone / pull)
/home/USERNAME/apps/erp_cnvs/
    ↓  Run NPM Install (symlink node_modules)
    ↓  .env + migrate
    ↓  npm run build (LOKAL, lalu upload .next) — disarankan
    ↓  Startup: server.js
    ↓  Restart Node.js App
```

---

## Prasyarat

| Item | Keterangan |
|------|------------|
| cPanel | Fitur **Git™ Version Control** + **Setup Node.js App** |
| Node.js | **20.x** (min. 18) |
| MySQL | Database + user dengan **ALL PRIVILEGES** |
| GitHub | Repo project (public atau deploy key untuk private) |

---

## Bagian 1 — Siapkan database (cPanel)

1. **MySQL® Databases** → buat database, mis. `senadar1_erp_cnvs`
2. Buat user, mis. `senadar1_user_erp_cnvs`
3. **Add User To Database** → **ALL PRIVILEGES**

Format `DATABASE_URL` (encode karakter khusus di password):

```env
# Password !Canvas123 → %21Canvas123
DATABASE_URL="mysql://USER:%21PASSWORD@localhost:3306/NAMA_DATABASE"
AUTH_SECRET="string-acak-minimal-16-karakter"
NODE_ENV=production
```

---

## Bagian 2 — Clone repo dari GitHub (sekali)

1. cPanel → **Git™ Version Control**
2. **Clone** → URL repo GitHub Anda
3. **Repository Path**: `apps/erp_cnvs`  
   (akan menjadi `/home/USERNAME/apps/erp_cnvs`)

**Penting (CloudLinux):** Jangan upload / commit folder `node_modules` ke repo.  
cPanel akan membuat **symlink** `node_modules` setelah **Run NPM Install**.

---

## Bagian 3 — Setup Node.js App

1. cPanel → **Setup Node.js App** → **Create Application**

| Field | Nilai |
|-------|--------|
| Node.js version | 20.x |
| Application mode | Production |
| Application root | `apps/erp_cnvs` |
| Application URL | subdomain Anda |
| Application startup file | **`server.js`** atau **`app.js`** |

2. Klik **Create**
3. Klik **Run NPM Install** (wajib — membuat symlink `node_modules`)

### Environment variables (di halaman Node.js App)

Tambahkan (sama seperti file `.env`):

- `NODE_ENV` = `production`
- `DATABASE_URL` = connection string MySQL
- `AUTH_SECRET` = minimal 16 karakter

`PORT` biasanya di-set otomatis oleh cPanel.

---

## Bagian 4 — File `.env` di server

Buat `/home/USERNAME/apps/erp_cnvs/.env` (File Manager atau Terminal):

```env
NODE_ENV=production
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/NAMA_DATABASE"
AUTH_SECRET="ganti-dengan-secret-min-16-char"
SEED_OWNER_EMAIL="owner@perusahaan.com"
SEED_OWNER_PASSWORD="PasswordKuat123!"
```

File `.env` tidak ada di GitHub (di-ignore). Buat manual di server.

---

## Bagian 5 — Aktifkan virtual environment (SSH)

Perintah `npm` / `npx` **tidak** tersedia di shell biasa. Salin perintah **“Enter to the virtual environment”** dari halaman **Setup Node.js App**, contoh:

```bash
source /home/USERNAME/nodevenv/apps/erp_cnvs/20/bin/activate
cd /home/USERNAME/apps/erp_cnvs
```

Cek:

```bash
which npm
npm -v
```

---

## Bagian 6 — Migrasi database

```bash
npm run cpanel:migrate
# Akun owner pertama (ringan, untuk cPanel):
npm run cpanel:seed:owner
# Data demo lengkap (berat — jalankan di komputer lokal, bukan di shared hosting):
# npm run cpanel:seed
```

**Jangan** pakai `npx prisma` tanpa versi (bisa mengunduh Prisma 7). Pakai `npm run cpanel:migrate`.

---

## Bagian 7 — Build (disarankan di komputer lokal)

Shared hosting sering gagal build dengan error **`EAGAIN`** (batas proses/worker).  
**Build di PC**, lalu upload folder `.next`.

### Di Windows (project lokal)

```powershell
cd D:\Activity\Canvas\erp_cnvs
npm install
npm run build
```

### Upload ke server

Upload folder **`.next/`** ke:

```text
/home/USERNAME/apps/erp_cnvs/.next/
```

Via File Manager, FTP, atau `rsync`.  
Jangan upload `node_modules` dari PC.

### Build di server (opsional, jika resource cukup)

```bash
npm install --include=dev
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

---

## Bagian 8 — Jalankan & restart

1. Pastikan folder `.next` ada di server
2. cPanel → **Setup Node.js App** → **Restart**
3. Buka URL subdomain → halaman login

Startup memuat `dotenv`, mengecek `.next`, lalu menjalankan Next.js lewat HTTP server custom.

---

## Bagian 9 — Update dari GitHub (pull rutin)

### Opsi A — Manual

1. cPanel → **Git™ Version Control** → repo → **Pull**
2. SSH:

```bash
source /home/USERNAME/nodevenv/apps/erp_cnvs/20/bin/activate
cd ~/apps/erp_cnvs
git pull origin main
npm install
npx prisma migrate deploy
```

3. Jika ada perubahan kode front-end: **build ulang di lokal** → upload `.next` baru
4. **Restart** Node.js App

### Opsi B — Hook otomatis `.cpanel.yml`

1. Edit `.cpanel.yml` di repo — ganti `USERNAME` dan path Node
2. Commit & push ke GitHub
3. Setiap **Pull** di cPanel, task deploy dijalankan otomatis (migrate, npm install)

Build di hook **tidak diaktifkan** secara default (hindari error EAGAIN).

---

## Checklist deploy pertama

- [ ] Repo di-clone ke `apps/erp_cnvs`
- [ ] Node.js App dibuat, startup **`server.js`**
- [ ] **Run NPM Install** (symlink `node_modules`)
- [ ] `.env` dibuat di server
- [ ] `npx prisma migrate deploy` sukses
- [ ] `.next` ada (build lokal + upload)
- [ ] Restart app → login berfungsi

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `npm: command not found` | `source .../nodevenv/.../activate` dulu |
| `DATABASE_URL` not found | Buat `.env` di root app |
| `P1010` access denied | ALL PRIVILEGES + encode password URL (`!` → `%21`) |
| `P1000` authentication failed | Password/username di `.env` salah atau belum di-encode |
| `timer has gone away` saat seed | Batas resource hosting — pakai `npm run cpanel:seed:owner` |
| Prisma 7 / `url` tidak didukung | Jangan `npx prisma` — pakai `npm run cpanel:migrate` |
| `@tailwindcss/postcss` not found | `npm install` (paket sudah di `dependencies` + `.npmrc include=dev`) |
| `EAGAIN` saat build | Build di lokal, upload `.next` |
| Folder `.next tidak ditemukan` | Upload hasil `npm run build` lokal |
| `node_modules` conflict | Hapus folder nyata, **Run NPM Install** lagi |

---

## Script npm yang tersedia

| Script | Fungsi |
|--------|--------|
| `npm start` | `node server.js` |
| `npm run build` | Build production Next.js |
| `npm run cpanel:migrate` | `prisma migrate deploy` |
| `npm run cpanel:seed` | Seed data awal |
| `npm run cpanel:deploy` | Migrate saja (setelah pull) |

---

## Keamanan

- Jangan commit `.env` ke GitHub
- Gunakan **HTTPS** di production (cookie auth memakai `secure`)
- Ganti password database jika pernah terpapar
