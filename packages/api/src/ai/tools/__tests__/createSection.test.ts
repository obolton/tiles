import { describe, test, expect, vi, beforeEach } from "vitest";
import { createSection } from "@/routes/sections/sections.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { SECTION_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_SECTION_TOOL } from "../createSection.ts";

vi.mock("@/routes/sections/sections.ts", () => ({
  createSection: vi.fn(),
}));

const BASE_ARGS = {
  size: "medium" as const,
  layout: "GRID" as const,
};

describe("CREATE_SECTION_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSection).mockResolvedValue(SECTION_TILE);
  });

  test("uses correct dimensions for each size", async () => {
    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, size: "small" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 12, height: 10 }),
    );

    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, size: "medium" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 15 }),
    );

    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, size: "large" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("passes layout to createSection", async () => {
    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, layout: "GRID" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "GRID" }),
    );

    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, layout: "HORIZONTAL" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "HORIZONTAL" }),
    );

    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, layout: "VERTICAL" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "VERTICAL" }),
    );

    await CREATE_SECTION_TOOL.function(
      { ...BASE_ARGS, layout: "FREEFORM" },
      MOCK_TOOL_CONTEXT,
    );
    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "FREEFORM" }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_SECTION_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createSection).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "test-page" }),
    );
  });

  test("returns artifact from createSection", async () => {
    const result = await CREATE_SECTION_TOOL.function(
      BASE_ARGS,
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: SECTION_TILE });
  });
});
