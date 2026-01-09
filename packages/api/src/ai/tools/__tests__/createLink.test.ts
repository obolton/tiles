import { describe, test, expect, vi, beforeEach } from "vitest";
import { createLink } from "@/routes/links/links.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { LINK_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_LINK_TOOL } from "../createLink.ts";

vi.mock("@/routes/links/links.ts", () => ({
  createLink: vi.fn(),
}));

describe("CREATE_LINK_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createLink).mockResolvedValue(LINK_TILE);
  });

  test("passes URL to createLink", async () => {
    await CREATE_LINK_TOOL.function(
      { sectionId: null, url: "https://example.com" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com" }),
    );
  });

  test("uses fixed dimensions of 24x8", async () => {
    await CREATE_LINK_TOOL.function(
      { sectionId: null, url: "https://example.com" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 8 }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_LINK_TOOL.function(
      { sectionId: null, url: "https://example.com" },
      context,
    );

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_LINK_TOOL.function(
      { sectionId: "section-0", url: "https://example.com" },
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
    await CREATE_LINK_TOOL.function(
      { sectionId: null, url: "https://example.com" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "page-1" }),
    );
  });

  test("returns artifact from createLink", async () => {
    const result = await CREATE_LINK_TOOL.function(
      { sectionId: null, url: "https://example.com" },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: LINK_TILE });
  });
});
