import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createMap, type Map, MAP_FIELDS } from "../maps.ts";
import type { CreateQuery } from "@/test/prisma.ts";

const MOCK_MAP: Map = {
  id: "test-map",
  places: [
    {
      id: "test-place",
      name: "Test place",
      providerId: "test-provider-id",
      lat: 0,
      long: 0,
      address: "Test address",
      boundingBox: [],
    },
  ],
};

const MOCK_PLACEMENT = {
  id: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

describe("createMap", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.mapTile.create<CreateQuery<typeof MAP_FIELDS>>,
    ).mockResolvedValue(MOCK_MAP);
    vi.mock("@/routes/tiles/tiles", () => ({
      createTile: () => MOCK_PLACEMENT,
    }));
  });

  it("should return a map", async () => {
    const result = await createMap({
      pageId: "1",
      sectionId: "test-collection",
      places: [
        {
          name: "Test place",
          providerId: "test-provider-id",
          lat: 0,
          long: 0,
          address: "Test address",
          boundingBox: null,
        },
      ],
    });

    expect(result).toEqual({
      type: "MAP",
      ...MOCK_PLACEMENT,
      ...MOCK_MAP,
    });
  });
});
