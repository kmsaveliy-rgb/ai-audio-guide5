import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Headphones, Trash2 } from "lucide-react";
import { getAudioConfig } from "@/lib/audio.functions";
import { countReadyAudio, deleteTourWithAudio, listTours, type SavedTour } from "@/lib/storage";
import { TourPlayer } from "@/components/TourPlayer";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Мои аудио — Аудиогид" },
      { name: "description", content: "Сохранённые экскурсии и готовые аудиозаписи остановок." },
      { property: "og:title", content: "Мои аудио — Аудиогид" },
      { property: "og:description", content: "Сохранённые экскурсии и готовая озвучка." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

function Library() {
  const [tours, setTours] = useState<SavedTour[] | null>(null);
  const [ready, setReady] = useState<Record<string, number>>({});
  const [voice, setVoice] = useState("default");
  const [open, setOpen] = useState<SavedTour | null>(null);

  async function refresh(v: string) {
    const list = await listTours();
    setTours(list);
    const counts: Record<string, number> = {};
    for (const t of list) counts[t.id] = await countReadyAudio(t.tour, v);
    setReady(counts);
  }

  useEffect(() => {
    getAudioConfig()
      .then((c) => c.voiceId)
      .catch(() => "default")
      .then((v) => {
        setVoice(v);
        refresh(v);
      });
  }, []);

  if (open)
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-8">
        <TourPlayer tour={open.tour} backLabel="Мои аудио" onBack={() => { setOpen(null); refresh(voice); }} />
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-5 px-5 pb-16 pt-8">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Новая экскурсия</Link>
      <h1 className="text-3xl font-semibold">Мои аудио</h1>
      {tours === null ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : tours.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">Здесь появятся созданные экскурсии и их озвучка.</p>
      ) : (
        <ul className="space-y-2">
          {tours.map((s) => {
            const n = ready[s.id] ?? 0;
            const total = s.tour.stops.length;
            return (
              <li key={s.id} className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-card">
                <button onClick={() => setOpen(s)} className="flex-1 text-left">
                  <p className="font-semibold leading-snug">{s.tour.title}</p>
                  <p className="text-xs text-muted-foreground">{s.destination} · {s.duration} мин · {s.style}</p>
                  <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${n > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    <Headphones className="h-3.5 w-3.5" /> Озвучено {n} из {total}
                  </p>
                </button>
                <button aria-label="Удалить" onClick={async () => { if (confirm("Удалить экскурсию и её аудио?")) { await deleteTourWithAudio(s, voice); refresh(voice); } }} className="p-2 text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
