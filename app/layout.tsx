import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galeri Projek Pelajar",
  description: "Galeri publik untuk karya dan projek pelajar."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-icon">✦</span>
            <span>Galeri Projek <small>Pelajar</small></span>
          </Link>
          <nav>
            <Link href="/">Galeri</Link>
            <Link href="/login">Login Guru</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>Galeri Projek Pelajar · Karya, kreativitas, dan inovasi.</p>
          <p className="muted">Hanya projek yang telah diterbitkan ditampilkan kepada publik.</p>
        </footer>
      </body>
    </html>
  );
}
