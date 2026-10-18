import { z } from "zod";

export const DURATIONS = [5, 15, 30, 60] as const;
export const STYLES = [
  "Историческая экскурсия",
  "Архитектура",
  "Легенды и загадки",
  "Необычные факты",
  "Прогулка по городу",
] as const;

/** Number of stops per tour duration. */
export function stopsForDuration(minutes: number): number {
  if (minutes <= 5) return 2;
  if (minutes <= 15) return 4;
  if (minutes <= 30) return 6;
  return 9;
}

export const stopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  narration: z.string().min(20),
  estimated_duration_minutes: z.coerce.number().positive(),
  historical_facts: z.array(z.string()).default([]),
  legend_notes: z.array(z.string()).default([]),
});

export const tourSchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  description: z.string().min(1),
  estimated_duration_minutes: z.coerce.number().positive(),
  stops: z.array(stopSchema).min(1),
});

export type Tour = z.infer<typeof tourSchema>;
export type Stop = z.infer<typeof stopSchema>;

export const generateInputSchema = z.object({
  destination: z.string().trim().min(2, "Укажите место").max(120),
  duration: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]),
  style: z.enum(STYLES),
  interests: z.string().trim().max(300).default(""),
  startLocation: z.string().trim().max(120).default(""),
});
export type GenerateInput = z.infer<typeof generateInputSchema>;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
