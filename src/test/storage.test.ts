import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  audioCacheText,
  audioKey,
  countReadyAudio,
  deleteTourWithAudio,
  getAudio,
  listTours,
  putAudio,
  saveTour,
  type SavedTour,
} from "@/lib/storage";
import type { Tour } from "@/lib/tour-schema";

const tour: Tour = {
  title: "Чжанцзяцзе",
  destination: "Чжанцзяцзе",
  description: "Тест",
  estimated_duration_minutes: 15,
  stops: [
    { id: "stop_1", name: "A", description: "", narration: "Первая остановка, достаточно длинный текст.", estimated_duration_minutes: 5, historical_facts: [], legend_notes: [] },
    { id: "stop_2", name: "B", description: "", narration: "Вторая остановка, тоже достаточно длинный текст.", estimated_duration_minutes: 5, historical_facts: [], legend_notes: [] },
  ],
};
const saved: SavedTour = { id: "t1", createdAt: 1, destination: "Чжанцзяцзе", style: "Легенды и загадки", duration: 15, tour };

describe("Мои аудио storage", () => {
  it("lists saved tours newest first and hides invalid old-format tours", async () => {
    await saveTour(saved);
    await saveTour({ ...saved, id: "t2", createdAt: 2 });
    await saveTour({ ...saved, id: "old", createdAt: 3, tour: { title: "x" } as unknown as Tour });
    const ids = (await listTours()).map((t) => t.id);
    expect(ids).toEqual(["t2", "t1"]);
  });

  it("ties cached audio to the voice", async () => {
    expect(await audioKey(audioCacheText("v1", "текст"))).not.toBe(await audioKey(audioCacheText("v2", "текст")));
  });

  it("counts stops that already have audio, so they are not regenerated", async () => {
    expect(await countReadyAudio(tour, "v1")).toBe(0);
    await putAudio(await audioKey(audioCacheText("v1", tour.stops[0]!.narration)), "AAAA");
    expect(await countReadyAudio(tour, "v1")).toBe(1);
    expect(await countReadyAudio(tour, "v2")).toBe(0);
  });

  it("deleting a tour also removes its audio", async () => {
    const key = await audioKey(audioCacheText("v1", tour.stops[0]!.narration));
    await deleteTourWithAudio(saved, "v1");
    expect(await getAudio(key)).toBeUndefined();
    expect((await listTours()).map((t) => t.id)).toEqual(["t2"]);
  });
});
