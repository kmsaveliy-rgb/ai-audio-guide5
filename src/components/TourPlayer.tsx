import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, RotateCcw, ArrowLeft } from "lucide-react";
import type { Tour } from "@/lib/tour-schema";
import { getAudioConfig, synthesizeStop } from "@/lib/audio.functions";
import { audioCacheText, audioKey, getAudio, putAudio } from "@/lib/storage";
import { LocationMap } from "@/components/LocationMap";

type State = "idle" | "loading" | "playing" | "paused" | "ended";

export function TourPlayer({ tour, onBack, backLabel = "Новая экскурсия" }: { tour: Tour; onBack: () => void; backLabel?: string }) {
  const [i, setI] = useState(0);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [voice, setVoice] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const busy = useRef(false);
  const stop = tour.stops[i] ?? tour.stops[0];

  useEffect(() => {
    getAudioConfig().then((c) => setVoice(c.voiceId)).catch(() => setVoice("default"));
  }, []);

  useEffect(() => {
    audio.current?.pause();
    audio.current = null;
    setState("idle");
    setError(null);
    if (voice && stop) audioKey(audioCacheText(voice, stop.narration)).then(getAudio).then((a) => setCached(!!a));
  }, [i, stop?.narration, voice]);

  useEffect(() => () => audio.current?.pause(), []);

  async function load(): Promise<HTMLAudioElement | null> {
    if (audio.current) return audio.current;
    if (busy.current) return null;
    busy.current = true;
    try {
      return await doLoad();
    } finally {
      busy.current = false;
    }
  }

  async function doLoad(): Promise<HTMLAudioElement | null> {
    if (!stop) return null;
    setState("loading");
    setError(null);
    const key = await audioKey(audioCacheText(voice ?? "default", stop.narration));
    let b64 = await getAudio(key);
    if (!b64) {
      try {
        const r = await synthesizeStop({ data: { text: stop.narration } });
        if (!r.ok) {
          setError(r.error);
          setState("idle");
          return null;
        }
        b64 = r.data;
        await putAudio(key, b64);
        setCached(true);
      } catch {
        setError("Не удалось получить аудио. Проверьте соединение.");
        setState("idle");
        return null;
      }
    }
    const el = new Audio(`data:audio/mpeg;base64,${b64}`);
    el.onended = () => setState("ended");
    el.onpause = () => !el.ended && setState("paused");
    el.onplay = () => setState("playing");
    audio.current = el;
    return el;
  }

  async function play() {
    const el = await load();
    if (!el) return;
    if (el.ended) el.currentTime = 0;
    await el.play().catch(() => setError("Браузер не разрешил воспроизведение. Нажмите ещё раз."));
  }
  const pause = () => audio.current?.pause();
  async function replay() {
    const el = await load();
    if (!el) return;
    el.currentTime = 0;
    await el.play();
  }

  if (!stop) return null;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </button>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">≈ {tour.estimated_duration_minutes} мин · {tour.stops.length} остановок</p>
        <h1 className="text-3xl font-semibold leading-tight">{tour.title}</h1>
        <p className="text-muted-foreground">{tour.description}</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tour.stops.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${idx === i ? "border-secondary bg-secondary text-secondary-foreground" : "bg-card"}`}
          >
            {idx + 1}. {s.name.length > 22 ? s.name.slice(0, 22) + "…" : s.name}
          </button>
        ))}
      </div>

      <section className="rounded-2xl bg-hero p-5 text-secondary-foreground shadow-card">
        <p className="text-xs uppercase tracking-widest opacity-70">Остановка {i + 1} из {tour.stops.length} · {stop.estimated_duration_minutes} мин</p>
        <h2 className="mt-1 text-2xl font-semibold">{stop.name}</h2>
        <div className="mt-5 flex items-center justify-between">
          <button aria-label="Предыдущая остановка" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full p-3 disabled:opacity-30">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <button aria-label="Сначала" onClick={replay} disabled={state === "loading"} className="rounded-full border border-secondary-foreground/30 p-3 disabled:opacity-40">
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              aria-label={state === "playing" ? "Пауза" : "Воспроизвести"}
              onClick={state === "playing" ? pause : play}
              disabled={state === "loading"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card"
            >
              {state === "loading" ? <Loader2 className="h-7 w-7 animate-spin" /> : state === "playing" ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
          </div>
          <button aria-label="Следующая остановка" disabled={i === tour.stops.length - 1} onClick={() => setI(i + 1)} className="rounded-full p-3 disabled:opacity-30">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <p className="mt-3 text-center text-xs opacity-70">
          {state === "loading" ? "Озвучиваем…" : state === "paused" ? "Пауза — нажмите, чтобы продолжить" : state === "ended" ? "Остановка прослушана" : cached ? "Аудио сохранено" : "Нажмите ▶, чтобы озвучить эту остановку"}
        </p>
      </section>

      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {stop.description && <p className="text-sm text-muted-foreground">{stop.description}</p>}

      {(stop.historical_facts.length > 0 || stop.legend_notes.length > 0) && (
        <ul className="space-y-2">
          {stop.historical_facts.map((t, k) => (
            <li key={`f${k}`} className="rounded-xl bg-fact p-3 text-sm text-fact-foreground">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest">Исторические сведения</span>
              {t}
            </li>
          ))}
          {stop.legend_notes.map((t, k) => (
            <li key={`l${k}`} className="rounded-xl bg-legend p-3 text-sm text-legend-foreground">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest">Легенда или спорная версия</span>
              {t}
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-xl bg-card p-4 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold">Текст озвучки</summary>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{stop.narration}</p>
      </details>

      <p className="text-xs text-muted-foreground">
        Текст создан ИИ и не проверялся по источникам. Сверяйте даты, маршруты и часы работы перед поездкой.
      </p>
      <LocationMap />
    </div>
  );
}
