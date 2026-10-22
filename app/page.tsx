import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const kategori = params.kategori ?? "Semua";
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("id,title,description,category,author_name,file_path,file_name,mime_type,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q.replace(/[%_,]/g, " ")}%,author_name.ilike.%${q.replace(/[%_,]/g, " ")}%`);
  if (kategori !== "Semua") query = query.eq("category", kategori);

  const { data, error } = await query;
  const projects = (data ?? []) as Project[];

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">RUANG KARYA PELAJAR</p>
          <h1>Ide hebat<br /><span>bermula di sini.</span></h1>
          <p className="hero-copy">Temukan karya, eksperimen, dan inovasi pelajar dalam satu galeri yang terbuka untuk semua.</p>
          <a className="button button-light" href="#galeri">Jelajahi projek <span aria-hidden>↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-card art-card-one"><span>✳</span><b>IDE</b><small>Jelajahi kemungkinan</small></div>
          <div className="art-card art-card-two"><span>↗</span><b>BUAT</b><small>Ubah ide jadi karya</small></div>
          <div className="art-orbit" />
        </div>
      </section>

      <section className="section" id="galeri">
        <div className="section-heading">
          <div><p className="eyebrow dark">KATALOG PUBLIK</p><h2>Jelajahi projek</h2></div>
          <span className="project-count">{projects.length} projek</span>
        </div>

        <form className="filters" action="/" method="get">
          <label className="search-box">
            <span aria-hidden>⌕</span>
            <input name="q" defaultValue={q} placeholder="Cari judul atau nama pelajar..." />
          </label>
          <select name="kategori" defaultValue={kategori} aria-label="Filter kategori">
            <option>Semua</option><option>Sains</option><option>Teknologi</option><option>Seni</option><option>Bahasa</option><option>Lainnya</option>
          </select>
          <button className="button button-dark" type="submit">Cari projek</button>
        </form>

        {error ? (
          <div className="empty-state"><h3>Galeri belum dapat dimuat.</h3><p>Pastikan konfigurasi Supabase dan skema database sudah disiapkan.</p></div>
        ) : projects.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✳</div><h3>Belum ada projek yang diterbitkan</h3><p>Silakan kembali lagi nanti untuk melihat karya terbaru.</p></div>
        ) : (
          <div className="project-grid">
            {projects.map((project, index) => {
              const { data: file } = supabase.storage.from("published-projects").getPublicUrl(project.file_path);
              return (
                <article className="project-card" key={project.id}>
                  <div className={`project-art art-tone-${index % 4}`}>
                    <span className="file-symbol">{project.mime_type.includes("pdf") ? "PDF" : project.mime_type.startsWith("image/") ? "IMG" : "DOC"}</span>
                    <span className="art-spark" aria-hidden>✳</span>
                    <span className="category-pill">{project.category}</span>
                  </div>
                  <div className="project-body">
                    <p className="card-meta">{project.author_name} <span>·</span> {new Date(project.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <h3>{project.title}</h3>
                    <p className="project-description">{project.description}</p>
                    <a className="text-link" href={file.publicUrl} target="_blank" rel="noreferrer">Buka / unduh berkas <span aria-hidden>↗</span></a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
