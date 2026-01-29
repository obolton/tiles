import { describe, test, expect, vi, beforeEach } from "vitest";
import { createLink } from "@/routes/links/links.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { LINK_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_LINK_TOOL } from "../createLink.ts";

vi.mock("@/routes/links/links.ts", () => ({
  createLink: vi.fn(),
}));

const BASE_ARGS = {
  sectionId: null,
  size: "medium" as const,
  url: "https://example.com",
  background: null,
  animation: null,
  frame: null,
  dock: null,
  hide: null,
  position: null,
};

describe("CREATE_LINK_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createLink).mockResolvedValue(LINK_TILE);
  });

  test("passes URL to createLink", async () => {
    await CREATE_LINK_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com" }),
    );
  });

  test("uses correct dimensions for medium size", async () => {
    await CREATE_LINK_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 15 }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_LINK_TOOL.function(BASE_ARGS, context);

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_LINK_TOOL.function(
      { ...BASE_ARGS, sectionId: "section-0" },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(
      "section-0",
    );
    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "resolved-section-0" }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_LINK_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "test-page" }),
    );
  });

  test("returns artifact from createLink", async () => {
    const result = await CREATE_LINK_TOOL.function(
      BASE_ARGS,
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: LINK_TILE });
  });
});
