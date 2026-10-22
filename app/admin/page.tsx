import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteProject, publishProject, signOut } from "./actions";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") {
    return <section className="section"><div className="empty-state"><h1>Akses ditolak</h1><p>Akun ini belum diberi peran admin. Minta pemilik situs menambahkannya ke tabel profiles.</p><Link href="/" className="text-link">Kembali ke galeri</Link></div></section>;
  }

  const { data } = await supabase.from("projects")
    .select("id,title,description,category,author_name,file_path,file_name,mime_type,created_at")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  return (
    <section className="section admin-section">
      <div className="section-heading">
        <div><p className="eyebrow dark">DASHBOARD ADMIN</p><h1>Kelola projek</h1><p className="muted">Login sebagai {profile.display_name || user.email}</p></div>
        <form action={signOut}><button className="button button-outline">Keluar</button></form>
      </div>

      {params.success && <p className="success-message">{params.success === "published" ? "Projek berhasil diterbitkan." : "Projek telah dihapus."}</p>}

      <div className="admin-layout">
        <div className="admin-panel">
          <h2>Terbitkan projek baru</h2>
          <p className="muted small">Berkas maksimal 20 MB. Projek langsung tampil untuk publik setelah disimpan.</p>
          <form className="stack-form" action={publishProject}>
            <label>Judul projek<input name="title" required maxLength={120} /></label>
            <label>Nama pelajar / kelompok<input name="author_name" required maxLength={100} /></label>
            <label>Kategori<select name="category" defaultValue="Sains"><option>Sains</option><option>Teknologi</option><option>Seni</option><option>Bahasa</option><option>Lainnya</option></select></label>
            <label>Deskripsi<textarea name="description" rows={4} maxLength={2000} /></label>
            <label>Berkas projek<input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,.pptx,.xlsx" /></label>
            <p className="muted tiny">Format yang didukung: PDF, JPG, PNG, WEBP, TXT, DOCX, PPTX, XLSX.</p>
            <button className="button button-dark full-width">Unggah dan terbitkan</button>
          </form>
        </div>

        <div className="admin-panel">
          <div className="section-heading compact"><h2>Projek terbit ({projects.length})</h2></div>
          {projects.length === 0 ? <p className="muted">Belum ada projek.</p> : <div className="admin-list">
            {projects.map(project => <div className="admin-item" key={project.id}>
              <div><strong>{project.title}</strong><p className="muted small">{project.category} · {project.author_name}</p><p className="muted tiny">{project.file_name}</p></div>
              <form action={deleteProject}><input type="hidden" name="id" value={project.id} /><button className="button button-danger button-small" aria-label={`Hapus ${project.title}`}>Hapus</button></form>
            </div>)}
          </div>}
        </div>
      </div>
    </section>
  );
}
