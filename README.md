# Deploy ke Vercel untuk uji coba

Panduan ini cocok untuk deploy proyek ini ke Vercel sebagai tahap uji coba sebelum production.

## 1. Siapkan kebutuhan dasar
Sebelum deploy, pastikan Anda sudah menyiapkan:
- Akun GitHub dan repositori proyek
- Akun Vercel
- Database PostgreSQL (contoh: Neon)
- Storage objek untuk upload gambar (contoh: Cloudflare R2)
- API key untuk layanan yang dipakai aplikasi, seperti Repliz, SumoPod, dan AI provider

## 2. Push kode ke GitHub
Jika belum, upload repository ke GitHub.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL-REPOSITORY-GITHUB>
git push -u origin main
```

## 3. Buat project di Vercel
1. Buka Vercel.
2. Klik New Project.
3. Import repository ini dari GitHub.
4. Vercel biasanya otomatis mendeteksi Next.js.
5. Pastikan setting berikut:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Install Command: `pnpm install --frozen-lockfile`
   - Output Directory: biarkan kosong (default Next.js)

## 4. Tambahkan environment variables
Buka Settings > Environment Variables di project Vercel, lalu tambahkan variabel berikut.

### Wajib untuk aplikasi jalan
```env
BETTER_AUTH_SECRET=buat-string-random-yang-panjang
BETTER_AUTH_URL=https://<nama-project>.vercel.app
NEXT_PUBLIC_APP_URL=https://<nama-project>.vercel.app
DATABASE_URL=postgresql://... 
API_KEY_ENCRYPTION_SECRET=32-byte-hex-string
```

### Untuk fitur upload gambar / carousel
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=your-public-domain-or-host
```

### Untuk integrasi Repliz
```env
REPLIZ_API_BASE_URL=https://api.repliz.com
REPLIZ_ACCESS_KEY=your-access-key
REPLIZ_SECRET_KEY=your-secret-key
```

### Untuk layanan AI / knowledge base
```env
SUMOPOD_PLATFORM_API_KEY=your-sumopod-key
```

> Catatan: `BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` harus memakai domain Vercel Anda yang benar, termasuk saat deploy pertama dan setelah custom domain.

## 5. Jalankan migrasi database
Sebelum aplikasi pertama kali dibuka, database harus sudah punya skema.

Di lokal, jalankan:

```bash
pnpm db:migrate
```

Pastikan variabel `DATABASE_URL` sudah tersedia di terminal Anda saat menjalankan perintah ini.

Jika Anda memakai Neon, Anda bisa isi `DATABASE_URL` dari dashboard Neon.

## 6. Deploy
1. Kembali ke Vercel.
2. Klik Deploy.
3. Tunggu proses build selesai.
4. Setelah sukses, buka URL hasil deploy.

## 7. Cek fitur dasar
Setelah deploy, uji hal-hal berikut:
- halaman utama terbuka
- login/register berjalan
- upload gambar bekerja
- fitur generate carousel berjalan
- integrasi sosial bisa masuk ke halaman callback

## 8. Jika ada error
Beberapa error umum yang sering muncul:
- `DATABASE_URL` belum diisi
- `BETTER_AUTH_SECRET` atau `API_KEY_ENCRYPTION_SECRET` kosong
- domain `BETTER_AUTH_URL` tidak sesuai dengan URL Vercel
- R2 credentials tidak valid
- build gagal karena env tidak tersedia saat build

## 9. Untuk uji coba lebih realistis
Kalau ingin tampilan lebih mirip production, Anda bisa tambahkan custom domain di Vercel dan pastikan semua URL environment variable mengarah ke domain tersebut.
