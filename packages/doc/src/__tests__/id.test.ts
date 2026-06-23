import { describe, expect, test } from "vitest";
import { createId } from "@/id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("createId", () => {
  test("returns a UUID", () => {
    expect(createId()).toMatch(UUID);
  });

  test("returns a unique value on each call", () => {
    const ids = new Set([createId(), createId(), createId()]);
    expect(ids.size).toBe(3);
  });
});
