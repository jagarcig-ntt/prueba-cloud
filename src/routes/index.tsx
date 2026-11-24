import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";
import { registrationSchema } from "@/lib/registration";

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === "up") {
      const result = registrationSchema.safeParse({ name, email, phone, dni, birthDate, password });
      if (!result.success) {
        setMsg(result.error.issues[0]?.message ?? "Revisa los datos del formulario.");
        return;
      }
    }
    setBusy(true);
    try {
    // Only account credentials are sent to auth; extra details never enter logs or storage.
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
    if (error) setMsg(error.message);
    else if (mode === "up") {
      setName(""); setPhone(""); setDni(""); setBirthDate(undefined);
      if (!data.session) setMsg("Revisa tu correo para confirmar la cuenta.");
    }
    } catch {
      setMsg("No se pudo completar el envío. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-bold text-foreground">Cuaderno</h1>
        <p className="mt-2 text-muted-foreground">Tus notas, solo para ti.</p>
        <form onSubmit={submit} className="mt-8 space-y-3 rounded-lg bg-card p-6 shadow-note">
          {mode === "up" && <label className="block space-y-1 text-sm">Nombre
            <input className={input} autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </label>}
          <label className="block space-y-1 text-sm">Email
            <input className={input} type="email" autoComplete="email" required maxLength={254} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode === "up" && <>
            <label className="block space-y-1 text-sm">Teléfono
              <input className={input} type="tel" autoComplete="tel" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">DNI
              <input className={input} required maxLength={9} value={dni} onChange={(e) => setDni(e.target.value)} />
            </label>
            <div className="space-y-1 text-sm">
              <label htmlFor="birth-date">Fecha de nacimiento</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button id="birth-date" type="button" variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon />{birthDate ? birthDate.toLocaleDateString("es-ES") : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="pointer-events-auto w-auto p-0">
                  <Calendar mode="single" locale={es} captionLayout="dropdown" startMonth={new Date(1900, 0)} endMonth={new Date()} disabled={{ after: new Date() }} {...(birthDate ? { selected: birthDate } : {})} onSelect={(date) => { setBirthDate(date); if (date) setCalendarOpen(false); }} />
                </PopoverContent>
              </Popover>
            </div>
          </>}
          <label className="block space-y-1 text-sm">Contraseña
            <input className={input} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Enviando…" : mode === "in" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
          {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
        </form>
        <Button type="button" variant="link" className="mt-4 h-auto whitespace-normal px-0 text-left" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); setName(""); setPhone(""); setDni(""); setBirthDate(undefined); }}>
          {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </Button>
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
