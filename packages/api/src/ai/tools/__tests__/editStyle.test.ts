import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { buildSectionMap } from "doc/tiles/section";
import { createToolContext, getTile } from "@/test/fixtures/ai.ts";
import { EDIT_STYLE_TOOL } from "../editStyle.ts";
import type { ToolContext } from "../types.ts";

const BASE_ARGS = {
  id: 0,
  background: null,
  textColor: null,
  animation: null,
  frame: null,
  hide: null,
  x: null,
  y: null,
  coordinates: null,
};

describe("EDIT_STYLE_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;
  let tileId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ doc, context } = createToolContext());
    tileId = context.session.createTile(buildSectionMap({ layout: "GRID" }));
    context.resolveArtifactId = vi.fn(() => tileId);
  });

  test("writes non-null style fields onto the tile", async () => {
    await EDIT_STYLE_TOOL.function(
      {
        ...BASE_ARGS,
        background: { type: "color", color: "#ff0000" },
        frame: "CARD",
        hide: true,
      },
      context,
    );

    const map = getTile(doc, tileId);
    expect(map.get("background")).toEqual({ type: "color", color: "#ff0000" });
    expect(map.get("frame")).toBe("CARD");
    expect(map.get("hide")).toBe(true);
  });

  test("maps coordinates to a nested object and x/y to flat fields", async () => {
    await EDIT_STYLE_TOOL.function(
      { ...BASE_ARGS, coordinates: { lat: 1.5, long: 2.5 }, x: 30, y: 60 },
      context,
    );

    const map = getTile(doc, tileId);
    expect(map.get("coordinates")).toEqual({ lat: 1.5, long: 2.5 });
    expect(map.get("x")).toBe(30);
    expect(map.get("y")).toBe(60);
  });

  test("leaves unspecified (null) fields unchanged", async () => {
    getTile(doc, tileId).set("frame", "OUTLINED");

    await EDIT_STYLE_TOOL.function(
      { ...BASE_ARGS, background: { type: "color", color: "#00ff00" } },
      context,
    );

    const map = getTile(doc, tileId);
    expect(map.get("frame")).toBe("OUTLINED");
    expect(map.get("background")).toEqual({ type: "color", color: "#00ff00" });
  });

  test("resolves the target tile id", async () => {
    await EDIT_STYLE_TOOL.function({ ...BASE_ARGS, id: 5 }, context);

    expect(context.resolveArtifactId).toHaveBeenCalledWith(5);
  });
});
