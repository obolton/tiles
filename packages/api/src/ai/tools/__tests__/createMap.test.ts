import { describe, test, expect, vi, beforeEach } from "vitest";
import { createMap } from "@/routes/maps/maps.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { MAP_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_MAP_TOOL } from "../createMap.ts";

vi.mock("@/routes/maps/maps.ts", () => ({
  createMap: vi.fn(),
}));

const MOCK_PLACE = {
  name: "Test Place",
  lat: 40.7128,
  long: -74.006,
  address: "123 Test St",
};

const BASE_ARGS = {
  sectionId: null,
  size: "medium" as const,
  style: null,
  places: [MOCK_PLACE],
};

describe("CREATE_MAP_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createMap).mockResolvedValue(MAP_TILE);
  });

  test("creates map with correct dimensions for each size", async () => {
    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "small" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ width: 12, height: 10 }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "medium" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 15 }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "large" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_MAP_TOOL.function(BASE_ARGS, context);

    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, sectionId: "section-0" },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(
      "section-0",
    );
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "resolved-section-0" }),
    );
  });

  test("transforms places with providerId from model", async () => {
    await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({
        places: [
          {
            name: "Test Place",
            lat: 40.7128,
            long: -74.006,
            address: "123 Test St",
            boundingBox: null,
            providerId: "test-model",
          },
        ],
      }),
    );
  });

  test("handles multiple places", async () => {
    const places = [
      { name: "Place 1", lat: 40.0, long: -74.0, address: null },
      { name: "Place 2", lat: 41.0, long: -75.0, address: "456 Other St" },
    ];

    await CREATE_MAP_TOOL.function({ ...BASE_ARGS, places }, MOCK_TOOL_CONTEXT);

    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({
        places: expect.arrayContaining([
          expect.objectContaining({ name: "Place 1", address: null }),
          expect.objectContaining({ name: "Place 2", address: "456 Other St" }),
        ]),
      }),
    );
  });

  test("transforms style to uppercase when provided", async () => {
    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, style: "satellite" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ style: "SATELLITE" }),
    );
  });

  test("passes undefined style when style is null", async () => {
    await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ style: undefined }),
    );
  });

  test("returns artifact from createMap", async () => {
    const result = await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(result).toEqual({ artifact: MAP_TILE });
  });
});
