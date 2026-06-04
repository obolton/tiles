import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai.ts";
import { CREATE_MAP_TOOL } from "../createMap.ts";
import type { ToolContext } from "../types.ts";

describe("CREATE_MAP_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
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
});
