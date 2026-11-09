import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai";
import { CREATE_MAP_TOOL } from "../createMap";
import type { ToolContext } from "../types";

describe("CREATE_MAP_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    ({ doc, context } = createToolContext());
  });

  test("creates a MAP-layout section with the given style", async () => {
    const result = await CREATE_MAP_TOOL.function(
      { size: "medium", mapStyle: "SATELLITE" },
      context,
    );

    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("SECTION");
    expect(map.get("layout")).toBe("MAP");
    expect(map.get("mapStyle")).toBe("SATELLITE");
  });

  test("falls back to the default style when none is given", async () => {
    const result = await CREATE_MAP_TOOL.function({ size: "small", mapStyle: null }, context);

    const map = getCreatedTile(doc, result);
    expect(map.get("mapStyle")).toBe("DEFAULT");
  });
});
