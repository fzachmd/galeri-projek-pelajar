"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
const CATEGORIES = new Set(["Sains", "Teknologi", "Seni", "Bahasa", "Lainnya"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") throw new Error("Akses ditolak. Akun ini bukan admin.");
  return { supabase, user };
}

export async function publishProject(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();
  const category = String(formData.get("category") ?? "Lainnya");
  const file = formData.get("file");

  if (!title || title.length > 120) throw new Error("Judul wajib diisi (maksimal 120 karakter).");
  if (!authorName || authorName.length > 100) throw new Error("Nama pengarang wajib diisi (maksimal 100 karakter).");
  if (description.length > 2000) throw new Error("Deskripsi maksimal 2.000 karakter.");
  if (!CATEGORIES.has(category)) throw new Error("Kategori tidak valid.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Pilih berkas projek.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Ukuran berkas maksimal 20 MB.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Jenis berkas tidak diizinkan. Gunakan PDF, JPG, PNG, WEBP, TXT, DOCX, PPTX, atau XLSX.");

  const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "projek";
  const filePath = `${user.id}/${crypto.randomUUID()}-${safeOriginalName}`;
  const { error: uploadError } = await supabase.storage.from("published-projects").upload(filePath, file, {
    contentType: file.type,
    upsert: false
  });
  if (uploadError) throw new Error(`Gagal mengunggah berkas: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("projects").insert({
    title, description, author_name: authorName, category,
    file_path: filePath, file_name: safeOriginalName, mime_type: file.type,
    status: "published", created_by: user.id
  });

  if (insertError) {
    await supabase.storage.from("published-projects").remove([filePath]);
    throw new Error(`Gagal menyimpan data projek: ${insertError.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?success=published");
}

export async function deleteProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data: project, error: fetchError } = await supabase
    .from("projects").select("id,file_path").eq("id", id).maybeSingle();
  if (fetchError || !project) throw new Error("Projek tidak ditemukan.");

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);
  if (deleteError) throw new Error(`Gagal menghapus projek: ${deleteError.message}`);

  const { error: storageError } = await supabase.storage.from("published-projects").remove([project.file_path]);
  if (storageError) console.error("Berkas tidak terhapus dari storage:", storageError.message);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?success=deleted");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
