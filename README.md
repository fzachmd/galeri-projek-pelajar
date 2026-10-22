# Galeri Projek Pelajar

Aplikasi Next.js + Supabase untuk galeri publik dengan unggahan hanya oleh guru/admin.

## Fitur
- Galeri publik, pencarian dan filter kategori.
- Login email/kata sandi untuk admin.
- Upload PDF, gambar, TXT, DOCX, PPTX, XLSX (maks. 20 MB).
- File publik hanya melalui bucket `published-projects`.
- Row Level Security (RLS) membatasi perubahan data dan file kepada admin.

## 1. Prasyarat
- Node.js 20.9+.
- Akun Supabase dan Vercel.
- Git (untuk deployment Vercel).

## 2. Jalankan lokal
```bash
npm install
cp .env.example .env.local
```
Isi `.env.local` dengan Project URL dan publishable/anon key dari Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```
Jangan pernah memakai `service_role` key di browser atau variabel `NEXT_PUBLIC_*`.

## 3. Siapkan database dan storage
1. Buka Supabase Dashboard → SQL Editor.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Di Supabase Authentication → Providers, pastikan Email aktif.
4. Di Authentication → URL Configuration, set Site URL ke URL situs lokal/deploy dan tambahkan redirect URLs yang diperlukan.
5. Buat pengguna admin melalui Authentication → Users → Add user (email + password).
6. Salin UUID pengguna itu dan jalankan SQL berikut (ganti UUID):
```sql
insert into public.profiles (id, display_name, role)
values ('UUID-PENGGUNA-DARI-AUTH', 'Guru Admin', 'admin')
on conflict (id) do update
set display_name = excluded.display_name, role = 'admin';
```
Tidak ada pendaftaran publik di aplikasi. Hanya admin yang dibuat oleh pemilik proyek yang dapat masuk.

## 4. Jalankan aplikasi
```bash
npm run dev
```
Buka http://localhost:3000. Login admin di `/login`; dashboard ada di `/admin`.

## 5. Deploy ke Vercel
1. Push folder proyek ini ke repositori GitHub.
2. Di Vercel, pilih Add New → Project, lalu import repositori.
3. Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada Project Settings → Environment Variables untuk Production, Preview, dan Development yang diperlukan.
4. Deploy.
5. Tambahkan domain Vercel ke Supabase Authentication → URL Configuration:
   - Site URL: `https://NAMA-PROJEK.vercel.app`
   - Redirect URLs: `https://NAMA-PROJEK.vercel.app/**`
6. Uji galeri dalam jendela privat dan uji login admin.

## Keamanan penting
- RLS adalah lapisan otorisasi utama; jangan mengandalkan menyembunyikan tombol di UI.
- Bucket `published-projects` sengaja publik. Siapa pun yang mendapatkan URL file dapat membacanya. Jangan unggah dokumen pribadi atau data sensitif pelajar.
- Server action memvalidasi tipe MIME dan ukuran, tetapi MIME dari browser bukan pemeriksaan malware. Untuk penggunaan sekolah, pertimbangkan antivirus / pemindaian file, rate limiting, logging, dan alur moderasi sebelum publikasi.
- Hapus/ubah peran admin hanya dari dashboard SQL/Supabase yang dikelola pemilik.
- Jangan pernah mengirim service-role key ke browser atau menyimpannya di Git.
- Untuk mengubah proyek menjadi moderasi draft, ubah `status` default pada SQL dan ubah action upload supaya menyimpan `draft`; lalu tambahkan aksi admin untuk menerbitkan draft.
- Sebaiknya gunakan email admin sekolah yang terkontrol dan aktifkan MFA jika tersedia.

## Struktur utama
```text
app/
  admin/
    actions.ts
    page.tsx
  login/
    login-form.tsx
    page.tsx
  globals.css
  layout.tsx
  page.tsx
lib/
  supabase/
    browser.ts
    server.ts
  types.ts
middleware.ts
supabase/
  schema.sql
```
