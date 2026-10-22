-- Jalankan seluruh SQL ini di Supabase Dashboard > SQL Editor.
-- Membuat tabel profil admin, tabel projek, bucket publik, dan kebijakan RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default 'Lainnya'
    check (category in ('Sains', 'Teknologi', 'Seni', 'Bahasa', 'Lainnya')),
  author_name text not null check (char_length(author_name) between 1 and 100),
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists projects_public_listing_idx
  on public.projects (status, created_at desc);
create index if not exists projects_category_idx
  on public.projects (category);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profil: pengguna hanya dapat membaca profilnya sendiri.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

-- Projek terbit boleh dibaca semua orang. Projek draft hanya admin yang boleh lihat.
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
on public.projects for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
on public.projects for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
on public.projects for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Bucket publik: file yang diterbitkan dapat diunduh siapa saja.
-- Hanya admin yang boleh mengunggah atau menghapus objek melalui API Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'published-projects',
  'published-projects',
  true,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload published project files" on storage.objects;
create policy "Admins can upload published project files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'published-projects'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "Admins can delete published project files" on storage.objects;
create policy "Admins can delete published project files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'published-projects'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Sengaja tidak ada policy INSERT/UPDATE/DELETE untuk anon atau viewer.
-- Jangan pernah menambahkan service-role key ke variabel NEXT_PUBLIC_*.
