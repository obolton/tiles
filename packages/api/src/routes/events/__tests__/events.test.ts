import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createEvent, updateEvent } from "../events.ts";
import { mockCreate, mockUpdate } from "../../../../test/prisma.ts";

describe("createEvent", () => {
  beforeAll(() => {
    vi.mocked(prisma.eventTile.create).mockImplementation(
      mockCreate({ id: "1" }),
    );
    vi.mocked(prisma.tile.count).mockResolvedValue(2);
    vi.mocked(prisma.tile.create).mockImplementation(mockCreate({ id: "2" }));
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
      id: "1",
      placementId: "2",
      columns: 1,
      rows: 1,
      position: 2,
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-02T00:00:00Z",
      allDay: true,
      timeZone: "UTC",
      title: "Test event",
    });
  });
});

describe("updateEvent", () => {
  beforeAll(() => {
    vi.mocked(prisma.eventTile.update).mockImplementation(
      mockUpdate({
        id: "1",
        start: "2024-01-01T00:00:00Z",
        end: "2024-01-02T00:00:00Z",
        allDay: true,
        timeZone: "UTC",
        title: "Test event",
      }),
    );
  });

  it("should update and return an event", async () => {
    const result = await updateEvent({
      id: "1",
      start: "2024-02-01T00:00:00Z",
      end: "2024-02-02T00:00:00Z",
      allDay: true,
      timeZone: "America/New_York",
      title: "Updated event",
    });

    expect(result).toEqual({
      type: "EVENT",
      id: "1",
      start: "2024-02-01T00:00:00Z",
      end: "2024-02-02T00:00:00Z",
      allDay: true,
      timeZone: "America/New_York",
      title: "Updated event",
    });
  });
});
