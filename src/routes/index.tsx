import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cuaderno — tus notas privadas" },
      { name: "description", content: "Regístrate con tu email y guarda notas que solo tú puedes ver." },
      { property: "og:title", content: "Cuaderno — tus notas privadas" },
      { property: "og:description", content: "Regístrate con tu email y guarda notas que solo tú puedes ver." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const input =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring";
const btn =
  "rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50";

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <main className="min-h-screen" />;
  return session ? <Notes session={session} /> : <Auth />;
}

function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Revisa tu correo para confirmar la cuenta.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-bold text-foreground">Cuaderno</h1>
        <p className="mt-2 text-muted-foreground">Tus notas, solo para ti.</p>
        <form onSubmit={submit} className="mt-8 space-y-3 rounded-lg bg-card p-6 shadow-note">
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className={`${btn} w-full`} disabled={busy}>
            {mode === "in" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>
        <button className="mt-4 text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </main>
  );
}

type Note = { id: string; title: string; content: string; created_at: string };

function Notes({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    setNotes(data ?? []);
  }
  useEffect(() => { load(); }, [session.user.id]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    setBusy(true);
    await supabase.from("notes").insert({ title, content, user_id: session.user.id });
    setTitle(""); setContent("");
    setBusy(false);
    load();
  }
  async function remove(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-4xl font-bold text-foreground">Cuaderno</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{session.user.email}</span>
          <button className="text-primary hover:underline" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>
      <form onSubmit={add} className="mt-8 space-y-3 rounded-lg bg-card p-5 shadow-note">
        <input className={input} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${input} min-h-24`} placeholder="Escribe una nota…" value={content} onChange={(e) => setContent(e.target.value)} />
        <button className={btn} disabled={busy}>Añadir nota</button>
      </form>
      {notes.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">Aún no tienes notas.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-lg bg-card p-5 shadow-note">
              <div className="flex justify-between gap-2">
                <h2 className="text-xl font-semibold text-foreground">{n.title || "Sin título"}</h2>
                <button aria-label="Borrar" className="text-sm text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive" onClick={() => remove(n.id)}>Borrar</button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-foreground/80">{n.content}</p>
              <p className="mt-3 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("es-ES")}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
