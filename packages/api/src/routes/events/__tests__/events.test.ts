import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createEvent, updateEvent, EVENT_FIELDS } from "../events.ts";
import type { CreateQuery, UpdateQuery } from "../../../../test/prisma.ts";

const MOCK_EVENT = {
  id: "test-event",
  title: "Test event",
  start: new Date("2024-01-01T00:00:00Z"),
  end: new Date("2024-01-02T00:00:00Z"),
  allDay: true,
  timeZone: "UTC",
};

const MOCK_PLACEMENT = {
  placementId: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

describe("createEvent", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.eventTile.create<CreateQuery<typeof EVENT_FIELDS>>,
    ).mockResolvedValue(MOCK_EVENT);
    vi.mock("@/routes/tiles/tiles.ts", () => ({
      createTilePlacement: async () => MOCK_PLACEMENT,
    }));
  });

  it("should return an event", async () => {
    const result = await createEvent({
      pageId: "1",
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-02T00:00:00Z",
      allDay: true,
      timeZone: "UTC",
      title: "Test event",
    });

    expect(result).toEqual({
      type: "EVENT",
      ...MOCK_EVENT,
      ...MOCK_PLACEMENT,
    });
  });
});

describe("updateEvent", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.eventTile.update<UpdateQuery<typeof EVENT_FIELDS>>,
    ).mockResolvedValue(MOCK_EVENT);
  });

  it("should update and return an event", async () => {
    const result = await updateEvent({
      pageId: "test-page",
      id: "1",
      title: MOCK_EVENT.title,
    });

    expect(result).toEqual({
      type: "EVENT",
      ...MOCK_EVENT,
    });
  });
});
