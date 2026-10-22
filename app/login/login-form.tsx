"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError("Login gagal. Periksa email dan kata sandi."); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Email pengelola<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
      <label>Kata sandi<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button button-dark full-width" disabled={busy}>{busy ? "Sedang masuk..." : "Masuk ke dashboard"}</button>
    </form>
  );
}
