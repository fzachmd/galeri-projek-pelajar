import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/admin");
  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow dark">AREA PENGELOLA</p>
        <h1>Login guru</h1>
        <p className="muted">Masuk dengan akun guru atau admin yang telah dibuat oleh pengelola Supabase.</p>
        <LoginForm />
      </div>
    </section>
  );
}
