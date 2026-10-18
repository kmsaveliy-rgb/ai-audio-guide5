import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { testGroq } from "@/lib/tour.functions";
import { testElevenLabs } from "@/lib/audio.functions";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Проверка сервисов — Аудиогид" },
      { name: "description", content: "Отдельная проверка генерации текста и синтеза речи." },
      { property: "og:title", content: "Проверка сервисов — Аудиогид" },
      { property: "og:description", content: "Проверка Groq и ElevenLabs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestPage,
});

function Check({ title, run }: { title: string; run: () => Promise<{ ok: boolean; text: string; audio?: string }> }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; text: string; audio?: string } | null>(null);
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button disabled={busy} onClick={async () => { setBusy(true); try { setRes(await run()); } catch { setRes({ ok: false, text: "Запрос не выполнен." }); } setBusy(false); }}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Проверить
        </button>
      </div>
      {res && (
        <div className={`mt-3 rounded-xl p-3 text-sm ${res.ok ? "bg-fact text-fact-foreground" : "bg-destructive/10 text-destructive"}`}>
          {res.ok ? "✓ " : "✗ "}{res.text}
          {res.audio && <audio controls autoPlay className="mt-2 w-full" src={`data:audio/mpeg;base64,${res.audio}`} />}
        </div>
      )}
    </div>
  );
}

function TestPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md space-y-4 px-5 pt-8">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Назад</Link>
      <h1 className="text-3xl font-semibold">Проверка сервисов</h1>
      <Check title="Groq — текст" run={async () => { const r = await testGroq(); return r.ok ? { ok: true, text: r.data } : { ok: false, text: r.error }; }} />
      <Check title="ElevenLabs — голос" run={async () => { const r = await testElevenLabs(); return r.ok ? { ok: true, text: "Аудио получено", audio: r.data } : { ok: false, text: r.error }; }} />
    </main>
  );
}
