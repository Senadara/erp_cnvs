# Deploy ERP ke cPanel (GitHub → Pull → Build → Run)

Panduan untuk hosting **CloudLinux + Node.js Selector** dengan **GitHub**. Diperbarui berdasarkan penyesuaian production nyata.

Aplikasi dijalankan lewat **`server.js`** atau **`app.js`** (alias).

---

## Ringkasan alur

```text
GitHub
  → git pull → ~/apps/erp_cnvs/
  → Setup Node.js App + Run NPM Install (symlink node_modules)
  → file .env + variabel lingkungan di panel
  → prisma migrate + prisma generate (+ seed owner)
  → BUILD di komputer Windows → ZIP .next (tanpa cache/dev) → upload & extract
  → .htaccess Passenger (buat lewat Setup Node.js App)
  → Restart Node.js App
```

**Tidak** build di server. **Ya** jalankan **`prisma generate`** di server setelah install/update dependency.

---

## Prasyarat

| Item | Keterangan |
|------|-------------|
| cPanel | **Git™ Version Control** + **Setup Node.js App** |
| Node.js | **20.x** (minimal 18) |
| MySQL | User + DB dengan **ALL PRIVILEGES** |
| GitHub | Repo kode |

---

## 1. Database MySQL

1. **MySQL® Databases** → buat database + user  
2. **Add User To Database** → centang **ALL PRIVILEGES**

**Selalu URL-encode** karakter password di connection string (`!` → `%21`, `@` → `%40`, dll.):

```env
DATABASE_URL="mysql://USERNAME:%21PASSWORD@localhost:3306/USERNAME_erpcnvs"
AUTH_SECRET="string-acak-minimal-16-karakter"
NODE_ENV=production
```

Error umum:

- **P1010** / **P1000**: user tidak di-assign atau password URL salah → encode + ALL PRIVILEGES.

---

## 2. Clone / path GitHub

1. **Git™ Version Control** → **Clone** → path repo: **`apps/erp_cnvs`**  
   Path lengkap: `/home/USERNAME/apps/erp_cnvs`

Jangan commit `node_modules`, `.next`, atau `.env` ke GitHub.

---

## 3. Subdomain & Document Root

Di **Domains** Anda boleh set Document Root submenu ke **`/apps/erp_cnvs`** (path relatif dari home). Itu konsisten dengan kode Anda.

Ini **belum** mencukupi: tanpa Node.js Selector, Anda hanya dapat **directory listing**.

| Gejala | Arti |
|--------|------|
| **Index of** di `/` | Apache melayani folder; **tidak ada** atau rusak blok **Passenger** di `.htaccess` |
| **404** untuk `/login` | Request masih ke Apache sebagai file biasa |

**Wajib** buat aplikasi di **Setup Node.js App**:

| Field | Nilai tipikal |
|-------|----------------|
| Application root | `apps/erp_cnvs` |
| Application URL | subdomain, mis. `erpcanvas.domain.tld` |
| Startup file | **`server.js`** |
| Mode | Production |

Klik **Run NPM Install** (membuat symlink `node_modules`). Setelah itu biasanya ada file **`.htaccess`** Passenger di folder app.

Contoh blok (buat ulang aplikasi kalau hilang):

- Lihat `deploy/htaccess.cpanel.example`

Tambahkan baris atas jika listing masih muncul:

```apache
Options -Indexes
```

---

## 4. Variabel lingkungan

### File `.env` di server (`~/apps/erp_cnvs/.env`)

```env
NODE_ENV=production
DATABASE_URL="mysql://..."
AUTH_SECRET="minimal-16-karakter"

# Akun pertama (script seed-owner)
SEED_OWNER_EMAIL="owner@perusahaan.com"
SEED_OWNER_PASSWORD="PasswordKuat123!"

# Opsional — Server Actions di belakang proxy subdomain (pisahkan dengan koma untuk banyak domain)
ALLOWED_ORIGINS=erpcanvas.domain.tld

# Opsional — jika cookie harus pakai insecure (hanya tes HTTP)
# COOKIE_SECURE=0
```

### Mirror di Setup Node.js App

Di halaman aplikasi Node, set environment variables yang sama (`NODE_ENV`, `DATABASE_URL`, `AUTH_SECRET`, `ALLOWED_ORIGINS`).

**Restart** setelah mengubah env.

---

## 5. SSH — aktifkan environment Node

Tanpa aktivasi ini, `npm` / `path` prisma tidak ada:

```bash
source /home/USERNAME/nodevenv/apps/erp_cnvs/20/bin/activate
cd ~/apps/erp_cnvs
which npm && npm -v
```

Sesuaikan `20` dengan versi Node di panel Anda.

Di Windows lokal untuk **cek browser**, buka:

- `http://localhost:3000/login`  

Bukan `http://0.0.0.0:3000` (alamat itu tidak valid di browser).

---

## 6. Install dependency & Prisma Client (KRITIKAL di server)

Setelah clone atau **`git pull`** yang mengubah `package.json` / schema:

```bash
source .../activate
cd ~/apps/erp_cnvs
npm install
# atau: Run NPM Install di cPanel — menjalankan postinstall prisma generate jika ada
```

**Pastikan generator Prisma ada** — tanpa itu login dan halaman apa pun akan error seperti:

```text
Cannot find module '.prisma/client/default'
```

Jalankan jika ragau:

```bash
./node_modules/.bin/prisma generate
```

Jangan bergantung pada `npx prisma` tanpa path (bisa unduh CLI **Prisma 7**, tidak cocok schema v6 repo ini).

Migrasi schema:

```bash
./node_modules/.bin/prisma migrate deploy
```

Atau jika `package.json` sudah ada script dari repo yang ter-push:

```bash
npm run cpanel:migrate
```

### Migrasi CLI — hindari versi salah

| Perintah | Rekomendasi |
|-------------|--------------|
| `./node_modules/.bin/prisma migrate deploy` | Aman |
| `npm run cpanel:migrate` | Aman |
| `npx prisma migrate deploy` | Bisa mendownload Prisma 7 → gagal parsing schema |

Seed **ringan** (disarankan di shared hosting):

```bash
node scripts/seed-owner.mjs
```

Hindari **`prisma db seed`** besar di shared hosting (`timer has gone away`).

---

## 7. Build HANYA di komputer Windows

**Jangan** `npm run build` di server CloudLinux symlink — error umum:

- Turbopack: symlink `node_modules` invalid  
- atau **EAGAIN** / worker Tailwind  

Di PC:

```powershell
cd D:\Activity\Canvas\erp_cnvs
npm install

# Sesuaikan domain production untuk konfig Next (experimental.serverActions)
# File .env lokal bisa berisi ALLOWED_ORIGINS=erpcanvas.domain.tld

npm run build
```

**Buat artefak lebih kecil** — jangan zip folder development:

```powershell
Remove-Item -Recurse -Force .next\cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next\trace, .next\diagnostics -ErrorAction SilentlyContinue

# Opsional ukuran paket ZIP
Compress-Archive -Path .next -DestinationPath next-build.zip -Force
(Get-Item next-build.zip).Length / 1MB
```

Ukuran zip sehat biasanya puluhan MB, **bukan** ratusan (kalau besar, pastikan tidak ada `.next/dev`).

Upload ke **`~/apps/erp_cnvs/`**, lalu SSH:

```bash
cd ~/apps/erp_cnvs
rm -rf .next
unzip -o next-build.zip
```

Struktur benar:

```text
apps/erp_cnvs/.next/BUILD_ID       ← langsung di sini
apps/erp_cnvs/.next/server/...
apps/erp_cnvs/.next/static/...
```

Bukan **`apps/erp_cnvs/.next/.next`** (nested – extract lagi dengan benar).

### Izin setelah unzip

```bash
chown -R USERNAME:USERNAME .next   # bisa gagal beberapa path jika pemilik root → hapus .next dan extract sebagai USERNAME
find .next -type d -exec chmod 755 {} \;
find .next -type f -exec chmod 644 {} \;
```

---

## 8. Restart & verifikasi

1. **Setup Node.js App** → **Restart**  
2. Tes dari SSH:

```bash
curl -I http://127.0.0.1:PORT/login
```

`PORT` sering **3000** (lihat `stderr.log` atau halaman aplikasi Node). Status **500** bisa berarti kurang **`prisma generate`** atau env salah (`DATABASE_URL`, `AUTH_SECRET`, dll.).

**Jangan** menjalankan `node server.js` manual jika app panel sudah jalan — Anda akan dapat **EADDRINUSE**. Untuk debug: Stop app panel dulu atau gunakan **`curl`** untuk menguji tanpa dua proses sekaligus.

3. Browser: **`https://subdomain/login`** (prefer HTTPS untuk cookie sesi).

---

## 9. Quota disk

`df -h ~` bisa menampilkan ruang besar sementara Anda tetap gagal **`user block limit reached`**. Itu bisa **quota CloudLinux per-user**.

Membersihkan aman:

```bash
rm -rf ~/.npm/_cacache ~/.npm/_logs
du -sh ~/* ~/nodevenv ~/.npm | sort -hr
```

Quota kecil bisa membuat **`npm install`** gagal dengan **errno -122**.

---

## 10. Pembaruan proyek (workflow)

Susunan keputusan setelah ada commit baru:

### A. Hanya ubah backend / prisma / paket NPM

```bash
source .../activate
cd ~/apps/erp_cnvs
git pull
npm install
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate deploy
```
Restart aplikasi panel.

### B. Ubah halaman Next / CSS / komponen / middleware / konfig Next

Selain langkah **A**:

1. Di Windows: **`git pull`**  
2. Atur **`ALLOWED_ORIGINS`** kalau subdomain berubah  
3. **`npm install`** dan **`npm run build`**  
4. Hapus `.next/cache` (dll.) seperti bagian 7  
5. Upload **`.next` baru**, extract, chmod  
6. **`prisma generate`** di server tetap boleh dijalankan jika dependency berubah  
7. Restart

### C. Hanya pembaruan `.env` atau variabel panel

Restart Node.js App (dan pastikan tidak ada penyimpangan antara file `.env` dan env panel).

### Checklist cepat pembaruan

- [ ] `git pull`  
- [ ] `npm install` (atau Run NPM Install)  
- [ ] `./node_modules/.bin/prisma generate`  
- [ ] `./node_modules/.bin/prisma migrate deploy` (kalau ada migrasi baru)  
- [ ] Upload `.next` baru **hanya** jika ada perubahan frontend / konfig bundler yang relevan  
- [ ] `chown`/chmod `.next` bila unzip via root  
- [ ] Restart aplikasi  

### Checklist anti-NPROC (WAJIB untuk shared hosting)

- [ ] **Stop Node.js App lebih dulu** di panel sebelum `npm install` / `prisma generate` / `migrate deploy`
- [ ] Jalankan command deploy **serial** (satu per satu), jangan paralel di beberapa terminal/sesi
- [ ] **Jangan build di server** (`npm run build` hanya di komputer lokal)
- [ ] Gunakan `./node_modules/.bin/prisma ...`, hindari `npx prisma ...`
- [ ] Hindari full seed saat deploy rutin; gunakan seed ringan (`node scripts/seed-owner.mjs`) bila perlu
- [ ] Setelah semua langkah selesai, baru **Start/Restart** Node.js App

### Urutan command baku (server, mode aman NPROC)

```bash
source /home/USERNAME/nodevenv/apps/erp_cnvs/20/bin/activate
cd ~/apps/erp_cnvs
git pull
npm run cpanel:deploy:safe
```

Jika tidak ada script helper, jalankan urutan manual:

```bash
npm install --no-audit --no-fund
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate deploy
```

---

## 11. Troubleshooting lengkap

| Gejala / error | Langkah utama |
|----------------|----------------|
| `npm: command not found` | `source .../nodevenv/.../activate` |
| `Missing script: cpanel:*` | Repo di server tidak ter-update — **`git pull`** dari branch yang benar |
| `DATABASE_URL` not found Prisma | Pastikan ada **`.env`** di root aplikasi (`~/apps/erp_cnvs`) |
| Prisma schema `url not supported` (P1012) | Anda pakai CLI **Prisma 7** — pakai **`./node_modules/.bin/prisma`** |
| **`Cannot find module '.prisma/client/default'`** | **`./node_modules/.bin/prisma generate`** lalu Restart |
| `prisma: command not found` / npx gagal | **`./node_modules/.bin/prisma generate`** bukan **`npx prisma`** sembarangan |
| `timer has gone away` (seed besar) | Pakai **`node scripts/seed-owner.mjs`** — bukan full seed di shared hosting |
| Zip `.next` ratusan MB | Ada `.next/dev` atau cache — build bersih dari **`npm run build`**, hapus **`cache`** |
| Turbopack symlink / tidak bisa build server | Tetap pada **build lokal** |
| **`Index of`** di domain | Passenger + **`.htaccess`** + URL di Node App benar → **`Options -Indexes`** |
| **`EADDRINUSE`** saat tes manual `node server.js` | Proses Passenger sudya listen — Stop app atau hanya tes dengan **`curl`** |
| **`EACCES`** di `.next/static` | **chown**/chmod seperti bagian 7 |
| **`chown`** gagal beberapa path | Mungkin file milik root — hapus **`rm -rf .next`** dan unzip lagi sebagai **user hosting** |
| Login **error generik browser** / digest | Cek **`stderr.log`**, kemungkinan Prisma atau env — perbaiki **`prisma generate`** & **`DATABASE_URL`** & **`ALLOWED_ORIGINS`** |
| **`Could not find Prisma Schema`** saat `npm install` (postinstall), padahal `prisma/schema.prisma` ada | cPanel Node Selector sering menjalankan lifecycle dari CWD **`nodevenv/.../lib`**. Pastikan repo pakai **`postinstall`** lewat `node scripts/postinstall-prisma.mjs` (lihat `package.json`), lalu **`git pull`** dan ulang `npm install`. Sementara: `npm install --ignore-scripts` lalu `./node_modules/.bin/prisma generate` dari root app. |

---

## 12. File referensi repo

| File | Fungsi |
|------|--------|
| `.env.example` | Contoh variabel lingkungan |
| `deploy/htaccess.cpanel.example` | Contoh `.htaccess` Passenger |
| `scripts/postinstall-prisma.mjs` | `postinstall` aman di cPanel: jalankan `prisma generate` dari root repo |
| `server.js` | Entry production (listen `PORT`, bind tidak memakai `HOSTNAME` IP publik) |

---

## 13. Keamanan

- Jangan commit **`.env`**
- Ganti kata sandi database jika pernah bocor
- Produksi pakai **HTTPS**
- Pertahankan **Prisma di major 6** sampai codebase dimigrasi ke Prisma 7 secara sengaja

---

Ringkasannya: pull di server → **install** → **`prisma generate` + migrate** → dari PC **build** → upload **`.next`** → **restart**. Tanpa **`prisma generate`**, Anda akan dapat error modul `.prisma/client` walau **`npm install`** sukses.
