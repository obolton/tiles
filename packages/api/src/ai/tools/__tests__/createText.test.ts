import { describe, test, expect, vi, beforeEach } from "vitest";
import { createText } from "@/routes/text/text.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { TEXT_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_TEXT_TOOL } from "../createText.ts";

vi.mock("@/routes/text/text.ts", () => ({
  createText: vi.fn(),
}));

describe("CREATE_TEXT_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createText).mockResolvedValue(TEXT_TILE);
  });

  test("creates text with correct dimensions for small size", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "small",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ width: 12, height: 10 }),
    );
  });

  test("creates text with correct dimensions for large size", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "large",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "medium",
      },
      context,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: "section-0",
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(
      "section-0",
    );
    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "resolved-section-0" }),
    );
  });

  test("maps alignment left to 0", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: "left",
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [{ type: "paragraph", align: 0, children: [] }],
      }),
    );
  });

  test("maps alignment center to 1", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: "center",
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [{ type: "paragraph", align: 1, children: [] }],
      }),
    );
  });

  test("maps alignment right to 2", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: "right",
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [{ type: "paragraph", align: 2, children: [] }],
      }),
    );
  });

  test("transforms backgroundColor to background object", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: "ff0000000000",
        align: null,
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({
        background: { type: "color", color: "ff0000000000" },
      }),
    );
  });

  test("passes undefined background when backgroundColor is null", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ background: undefined }),
    );
  });

  test("passes textColor directly", async () => {
    await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: "000000000000",
        backgroundColor: null,
        align: null,
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createText).toHaveBeenCalledWith(
      expect.objectContaining({ textColor: "000000000000" }),
    );
  });

  test("returns artifact from createText", async () => {
    const result = await CREATE_TEXT_TOOL.function(
      {
        sectionId: null,
        textColor: null,
        backgroundColor: null,
        align: null,
        size: "medium",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: TEXT_TILE });
  });
});
