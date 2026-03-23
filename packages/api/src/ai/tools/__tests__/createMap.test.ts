import { describe, test, expect, vi, beforeEach } from "vitest";
import { createSection } from "@/routes/sections/sections.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { SECTION_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_MAP_TOOL } from "../createMap.ts";

vi.mock("@/routes/sections/sections.ts", () => ({
  createSection: vi.fn(),
}));

const BASE_ARGS = {
  size: "medium" as const,
  mapStyle: "DEFAULT" as const,
};

describe("CREATE_MAP_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSection).mockResolvedValue(SECTION_TILE);
  });

  test("creates a section with MAP layout", async () => {
    await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "MAP" }),
    );
  });

  test("passes mapStyle to createSection", async () => {
    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, mapStyle: "SATELLITE" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ mapStyle: "SATELLITE" }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, mapStyle: "WATERCOLOR" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ mapStyle: "WATERCOLOR" }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, mapStyle: "MONOCHROME" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ mapStyle: "MONOCHROME" }),
    );
  });

  test("uses correct dimensions for each size", async () => {
    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "small" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 12, height: 10 }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "medium" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 15 }),
    );

    await CREATE_MAP_TOOL.function(
      { ...BASE_ARGS, size: "large" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "test-page" }),
    );
  });

  test("returns artifact from createSection", async () => {
    const result = await CREATE_MAP_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(result).toEqual({ artifact: SECTION_TILE });
  });
});
