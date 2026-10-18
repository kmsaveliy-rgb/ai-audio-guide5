import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Result } from "./tour-schema";

// Voice is configurable via the ELEVENLABS_VOICE_ID server secret.
// Fallback: "George", one of ElevenLabs' standard premade voices.
const FALLBACK_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const voiceId = () => process.env['ELEVENLABS_VOICE_ID'] || FALLBACK_VOICE_ID;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function ttsError(status: number, body: string): string {
  if (status === 401) return "Ключ ElevenLabs недействителен или без прав на синтез речи.";
  if (status === 429) return "Превышен лимит запросов к ElevenLabs. Подождите и попробуйте снова.";
  if (/quota|credits/i.test(body)) return "Закончились символы/кредиты в аккаунте ElevenLabs.";
  if (status === 404) return "Голос не найден. Проверьте настройку ELEVENLABS_VOICE_ID.";
  if (status >= 500) return "Сервис ElevenLabs временно недоступен. Попробуйте позже.";
  return `Ошибка синтеза речи (код ${status}).`;
}

async function synth(text: string): Promise<Result<string>> {
  const key = process.env['ELEVENLABS_API_KEY'];
  if (!key) return { ok: false, error: "Озвучка не настроена: не задан секрет ELEVENLABS_API_KEY. Текст экскурсии доступен." };
  let res: Response;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId()}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          language_code: "ru",
          voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        }),
      },
    );
  } catch {
    return { ok: false, error: "Не удалось связаться с ElevenLabs. Проверьте соединение." };
  }
  if (!res.ok) {
    const body = await res.text();
    console.error("ElevenLabs error status", res.status);
    return { ok: false, error: ttsError(res.status, body) };
  }
  return { ok: true, data: toBase64(await res.arrayBuffer()) };
}

/** Public, non-secret audio config used as part of the client cache key. */
export const getAudioConfig = createServerFn({ method: "GET" }).handler(async () => ({
  voiceId: voiceId(),
  configured: !!process.env['ELEVENLABS_API_KEY'],
}));

export const synthesizeStop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(5000) }).parse(d))
  .handler(async ({ data }) => synth(data.text));

export const testElevenLabs = createServerFn({ method: "POST" }).handler(async () =>
  synth("Здравствуйте! Это проверка русского голоса для аудиоэкскурсии."),
);
