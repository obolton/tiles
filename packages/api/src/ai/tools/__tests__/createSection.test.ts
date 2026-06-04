import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai.ts";
import { CREATE_SECTION_TOOL } from "../createSection.ts";
import type { ToolContext } from "../types.ts";

describe("CREATE_SECTION_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ doc, context } = createToolContext());
  });

  test("creates a section tile with the given layout", async () => {
    const result = await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "GRID" },
      context,
    );

    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("SECTION");
    expect(map.get("layout")).toBe("GRID");
  });

  test("places the section at the page root", async () => {
    const result = await CREATE_SECTION_TOOL.function(
      { size: "medium", layout: "VERTICAL" },
      context,
    );

    expect(getCreatedTile(doc, result).get("parentId")).toBeNull();
  });

  test("sets dimensions for the given size", async () => {
    const result = await CREATE_SECTION_TOOL.function(
      { size: "large", layout: "GRID" },
      context,
    );

    const map = getCreatedTile(doc, result);
    expect(map.get("width")).toBe(24);
    expect(map.get("height")).toBe(20);
  });
});
