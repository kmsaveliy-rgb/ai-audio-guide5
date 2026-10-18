import { describe, expect, it } from "vitest";
import { generateInputSchema, stopsForDuration, tourSchema } from "@/lib/tour-schema";

describe("tour rules", () => {
  it("only allows 5, 15, 30, 60 minute durations", () => {
    expect(generateInputSchema.safeParse({ destination: "Казань", duration: 15, style: "Архитектура" }).success).toBe(true);
    expect(generateInputSchema.safeParse({ destination: "Казань", duration: 20, style: "Архитектура" }).success).toBe(false);
  });
  it("scales stop count with duration", () => {
    expect(stopsForDuration(5)).toBe(2);
    expect(stopsForDuration(60)).toBe(9);
  });
  it("rejects tours without stops", () => {
    expect(tourSchema.safeParse({ title: "a", destination: "x", description: "b", estimated_duration_minutes: 5, stops: [] }).success).toBe(false);
  });
});
