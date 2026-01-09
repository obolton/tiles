import { describe, test, expect, vi, beforeEach } from "vitest";
import { createSection } from "@/routes/sections/sections.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { SECTION_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_SECTION_TOOL } from "../createSection.ts";

vi.mock("@/routes/sections/sections.ts", () => ({
  createSection: vi.fn(),
}));

describe("CREATE_SECTION_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSection).mockResolvedValue(SECTION_TILE);
  });

  test("uses correct dimensions for each size", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "small", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 12, height: 10 }),
    );

    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 15 }),
    );

    await CREATE_SECTION_TOOL.function(
      { size: "large", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("transforms layout to uppercase", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "grid", backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "GRID" }),
    );

    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "horizontal", backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "HORIZONTAL" }),
    );

    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "vertical", backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "VERTICAL" }),
    );

    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "freeform", backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "FREEFORM" }),
    );
  });

  test("passes undefined layout when layout is null", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: undefined }),
    );
  });

  test("transforms backgroundColor to background object", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: "ff0000000000" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({
        background: { type: "color", color: "ff0000000000" },
      }),
    );
  });

  test("passes undefined background when backgroundColor is null", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ background: undefined }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "page-1" }),
    );
  });

  test("returns artifact from createSection", async () => {
    const result = await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: null, backgroundColor: null },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: SECTION_TILE });
  });
});
