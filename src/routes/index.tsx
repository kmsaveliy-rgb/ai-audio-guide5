import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headphones, Loader2, MapPin, Wrench } from "lucide-react";
import { DURATIONS, STYLES, type Tour } from "@/lib/tour-schema";
import { generateTour } from "@/lib/tour.functions";
import { listTours, saveTour, type SavedTour } from "@/lib/storage";
import { TourPlayer } from "@/components/TourPlayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Аудиогид — ИИ-экскурсии на русском" },
      { name: "description", content: "Создайте аудиоэкскурсию по любому месту за минуту: остановки, факты, легенды и озвучка на русском." },
      { property: "og:title", content: "Аудиогид — ИИ-экскурсии на русском" },
      { property: "og:description", content: "Аудиоэкскурсии по любому месту с озвучкой на русском языке." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(15);
  const [style, setStyle] = useState<(typeof STYLES)[number]>(STYLES[0]);
  const [interests, setInterests] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tour, setTour] = useState<Tour | null>(null);
  const [saved, setSaved] = useState<SavedTour[]>([]);

  useEffect(() => {
    listTours().then(setSaved);
  }, [tour]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (destination.trim().length < 2) return setError("Укажите место для экскурсии.");
    setLoading(true);
    setError(null);
    try {
      const r = await generateTour({ data: { destination: destination.trim(), duration, style, interests, startLocation } });
      if (!r.ok) setError(r.error);
      else {
        await saveTour({ id: crypto.randomUUID(), createdAt: Date.now(), destination, style, duration, tour: r.data });
        setTour(r.data);
      }
    } catch {
      setError("Не удалось создать экскурсию. Проверьте соединение и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-8">
      {tour ? (
        <TourPlayer tour={tour} onBack={() => setTour(null)} />
      ) : (
        <>
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Аудиогид</p>
              <h1 className="mt-2 text-4xl font-semibold leading-[1.05]">Куда отправимся сегодня?</h1>
            </div>
            <div className="flex gap-2">
              <Link to="/library" aria-label="Мои аудио" className="rounded-full bg-card p-2.5 text-muted-foreground shadow-card">
                <Headphones className="h-4 w-4" />
              </Link>
              <Link to="/test" aria-label="Проверка сервисов" className="rounded-full bg-card p-2.5 text-muted-foreground shadow-card">
                <Wrench className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Место</span>
              <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 shadow-card focus-within:ring-2 focus-within:ring-ring">
                <MapPin className="h-5 w-5 text-primary" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Например, Казань, Кремль"
                  className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Интересы <span className="font-normal text-muted-foreground">(необязательно)</span></span>
              <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Например, природа, фильм «Аватар», геология"
                className="h-12 w-full rounded-2xl border bg-card px-4 text-base shadow-card outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Начало маршрута <span className="font-normal text-muted-foreground">(необязательно)</span></span>
              <input value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="Например, вход в парк"
                className="h-12 w-full rounded-2xl border bg-card px-4 text-base shadow-card outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Длительность</legend>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button type="button" key={d} onClick={() => setDuration(d)}
                    className={`rounded-xl border py-3 text-sm font-semibold ${d === duration ? "border-secondary bg-secondary text-secondary-foreground" : "bg-card"}`}>
                    {d} мин
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Стиль</legend>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button type="button" key={s} onClick={() => setStyle(s)}
                    className={`rounded-full border px-4 py-2 text-sm ${s === style ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-card disabled:opacity-70">
              {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Готовим экскурсию…</>) : "Создать экскурсию"}
            </button>
          </form>

          <Link to="/library" className="mt-6 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
            <span className="flex items-center gap-2 font-semibold"><Headphones className="h-5 w-5 text-primary" /> Мои аудио</span>
            <span className="text-sm text-muted-foreground">{saved.length} {saved.length === 1 ? "экскурсия" : "экскурсий"} →</span>
          </Link>
        </>
      )}
    </main>
  );
}
