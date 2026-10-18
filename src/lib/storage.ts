// Browser-side storage (IndexedDB) for saved tours and cached stop audio.
import { tourSchema, type Tour } from "./tour-schema";

export interface SavedTour {
  id: string;
  createdAt: number;
  destination: string;
  style: string;
  duration: number;
  tour: Tour;
}

const DB = "audiotour";
function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("tours", { keyPath: "id" });
      req.result.createObjectStore("audio");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const r = fn(db.transaction(store, mode).objectStore(store));
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => resolve(undefined);
  });
}

export const saveTour = (t: SavedTour) => tx("tours", "readwrite", (s) => s.put(t));
export const deleteTour = (id: string) => tx("tours", "readwrite", (s) => s.delete(id));
export async function listTours(): Promise<SavedTour[]> {
  const all = (await tx<SavedTour[]>("tours", "readonly", (s) => s.getAll())) ?? [];
  return all.filter((t) => tourSchema.safeParse(t.tour).success).sort((a, b) => b.createdAt - a.createdAt);
}

export async function audioKey(text: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const getAudio = (key: string) => tx<string>("audio", "readonly", (s) => s.get(key));
export const putAudio = (key: string, b64: string) => tx("audio", "readwrite", (s) => s.put(b64, key));

/** Cache key text: audio is tied to both the voice and the exact narration. */
export const audioCacheText = (voiceId: string, narration: string) => `${voiceId}|${narration}`;

/** How many stops of a tour already have saved audio for this voice. */
export async function countReadyAudio(tour: Tour, voiceId: string): Promise<number> {
  let n = 0;
  for (const s of tour.stops) {
    if (await getAudio(await audioKey(audioCacheText(voiceId, s.narration)))) n++;
  }
  return n;
}

/** Delete a tour and the saved audio of its stops. */
export async function deleteTourWithAudio(t: SavedTour, voiceId: string): Promise<void> {
  for (const s of t.tour.stops) {
    const key = await audioKey(audioCacheText(voiceId, s.narration));
    await tx("audio", "readwrite", (st) => st.delete(key));
  }
  await deleteTour(t.id);
}
