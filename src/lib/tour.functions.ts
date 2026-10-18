import { createServerFn } from "@tanstack/react-start";
import {
  generateInputSchema,
  stopsForDuration,
  tourSchema,
  type Result,
  type Tour,
} from "./tour-schema";

// Model is configurable via the GROQ_MODEL server secret; this is only a fallback.
const FALLBACK_MODEL = "openai/gpt-oss-120b";

function groqError(status: number): string {
  if (status === 429) return "Превышен лимит запросов к Groq. Подождите минуту и попробуйте снова.";
  if (status === 401) return "Ключ Groq недействителен. Проверьте секрет GROQ_API_KEY.";
  if (status === 403) return "Доступ к Groq запрещён. Проверьте ключ и его права.";
  if (status === 404) return "Модель Groq не найдена. Проверьте настройку GROQ_MODEL.";
  if (status === 400) return "Groq отклонил запрос. Возможно, модель из GROQ_MODEL не поддерживает JSON-режим.";
  if (status >= 500) return "Сервис Groq временно недоступен. Попробуйте позже.";
  return `Ошибка запроса к Groq (код ${status}).`;
}

async function callGroq(
  messages: { role: "system" | "user"; content: string }[],
  json: boolean,
): Promise<Result<string>> {
  const key = process.env['GROQ_API_KEY'];
  if (!key) return { ok: false, error: "Не задан ключ Groq (секрет GROQ_API_KEY) на сервере." };
  const model = process.env['GROQ_MODEL'] || FALLBACK_MODEL;
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_completion_tokens: 32000,
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  } catch {
    return { ok: false, error: "Не удалось связаться с Groq. Проверьте соединение." };
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    let code = "";
    try { code = JSON.parse(errBody)?.error?.code ?? ""; } catch { /* ignore */ }
    console.error("Groq error", res.status, code, errBody.slice(0, 300));
    if (code === "json_validate_failed")
      return { ok: false, error: "Groq сформировал некорректный JSON. Попробуйте ещё раз." };
    return { ok: false, error: groqError(res.status) };
  }
  try {
    const parsed = await res.json();
    const choice = parsed?.choices?.[0];
    const text: string | undefined = choice?.message?.content;
    if (!text) return { ok: false, error: "Groq вернул пустой ответ. Попробуйте ещё раз." };
    if (choice?.finish_reason === "length")
      return { ok: false, error: "Ответ Groq оборвался (слишком длинный). Попробуйте меньшую длительность." };
    return { ok: true, data: text };
  } catch {
    return { ok: false, error: "Не удалось разобрать ответ Groq." };
  }
}

const SYSTEM = `Ты — опытный русскоязычный экскурсовод и историк. Пишешь тексты для аудиогида, которые слушают на ходу.
Правила:
- Только русский язык. Живая разговорная речь, без markdown, списков и эмодзи.
- Без шаблонных вступлений («Добро пожаловать», «Итак», «Давайте») и воды. Каждая остановка начинается по-разному.
- Не выдумывай факты, даты, цитаты, имена и архитектурные детали. Если не уверен — не упоминай или скажи, что сведения расходятся.
- Чётко отделяй документированную историю от легенд и спорных версий («по легенде», «по одной из версий»).
- Не утверждай, что маршрут, часы работы или факты проверены.
- Отвечай только валидным JSON.`;

export const generateTour = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => generateInputSchema.parse(d))
  .handler(async ({ data }): Promise<Result<Tour>> => {
    const stops = stopsForDuration(data.duration);
    const words = Math.round((data.duration / stops) * 110);
    const prompt = `Составь аудиоэкскурсию.
Место: ${data.destination}
Тема: ${data.style}
Длительность: около ${data.duration} минут
Количество остановок: ${stops}
${data.interests ? `Интересы слушателя: ${data.interests}` : ""}
${data.startLocation ? `Начало маршрута: ${data.startLocation}` : ""}

Narration каждой остановки — около ${words} слов, это полный текст для озвучки.
historical_facts — 1–3 документированных факта (строки). legend_notes — 0–3 легенды или спорные версии (строки).

Верни JSON строго такой формы:
{"title": string, "destination": string, "description": string, "estimated_duration_minutes": number,
 "stops": [{"id": "stop_1", "name": string, "description": string, "narration": string,
   "estimated_duration_minutes": number, "historical_facts": string[], "legend_notes": string[]}]}`;

    const r = await callGroq(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      true,
    );
    if (!r.ok) return r;
    let raw: unknown;
    try {
      raw = JSON.parse(r.data.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      return { ok: false, error: "Groq вернул некорректный JSON. Попробуйте ещё раз." };
    }
    const parsed = tourSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Tour validation failed", parsed.error.issues.map((i) => i.path.join(".")));
      return { ok: false, error: "Ответ Groq неполный или не прошёл проверку. Попробуйте ещё раз." };
    }
    return { ok: true, data: parsed.data };
  });

export const testGroq = createServerFn({ method: "POST" }).handler(
  async (): Promise<Result<string>> =>
    callGroq([{ role: "user", content: "Ответь одним коротким предложением по-русски: ты работаешь?" }], false),
);
