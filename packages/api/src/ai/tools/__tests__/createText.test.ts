import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { DocWriter } from "@/collaboration/DocWriter";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { CREATE_TEXT_TOOL } from "../createText";
import type { ToolContext } from "../types";

const BASE_ARGS = {
  parentId: null,
  align: null,
  size: "medium" as const,
  coordinates: null,
};

describe("CREATE_TEXT_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    doc = new Y.Doc();
    context = { ...MOCK_TOOL_CONTEXT, session: new DocWriter(doc) };
  });

  function tile(result: unknown): Y.Map<unknown> {
    const { tileId } = result as { tileId: string };
    return doc.getMap<Y.Map<unknown>>("tiles").get(tileId)!;
  }

  test("creates a text tile with an empty content fragment", async () => {
    const result = await CREATE_TEXT_TOOL.function(BASE_ARGS, context);

    const map = tile(result);
    expect(map.get("type")).toBe("TEXT");
    expect(map.get("content")).toBeInstanceOf(Y.XmlFragment);
    expect((map.get("content") as Y.XmlFragment).length).toBe(0);
  });

  test("sets dimensions for small size", async () => {
    const result = await CREATE_TEXT_TOOL.function({ ...BASE_ARGS, size: "small" }, context);

    const map = tile(result);
    expect(map.get("width")).toBe(12);
    expect(map.get("height")).toBe(10);
  });

  test("places at the page root when there is no section", async () => {
    const result = await CREATE_TEXT_TOOL.function(BASE_ARGS, context);

    expect(tile(result).get("parentId")).toBeNull();
  });

  test("uses the context sectionId as the parent", async () => {
    const result = await CREATE_TEXT_TOOL.function(BASE_ARGS, {
      ...context,
      sectionId: "context-section",
    });

    expect(tile(result).get("parentId")).toBe("context-section");
  });

  test("resolves an args parentId to the parent", async () => {
    const result = await CREATE_TEXT_TOOL.function({ ...BASE_ARGS, parentId: 0 }, context);

    expect(context.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(tile(result).get("parentId")).toBe("resolved-0");
  });
});
