import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { buildSectionMap } from "doc/tiles/section";
import { createToolContext } from "@/test/fixtures/ai";
import { DELETE_TILES_TOOL } from "../deleteTile";
import type { ToolContext } from "../types";

describe("DELETE_TILES_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;
  let sectionA: string;
  let sectionB: string;
  let sectionC: string;

  beforeEach(() => {
    ({ doc, context } = createToolContext());
    sectionA = context.session.createTile(buildSectionMap({}));
    sectionB = context.session.createTile(buildSectionMap({}));
    sectionC = context.session.createTile(buildSectionMap({}));
    const ids = [sectionA, sectionB, sectionC];
    context.resolveArtifactId = vi.fn((id: number) => ids[id] ?? "");
  });

  function tiles(): Y.Map<Y.Map<unknown>> {
    return doc.getMap<Y.Map<unknown>>("tiles");
  }

  test("deletes a single tile from the doc", async () => {
    await DELETE_TILES_TOOL.function({ ids: [0] }, context);

    expect(context.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(tiles().has(sectionA)).toBe(false);
    expect(tiles().size).toBe(2);
  });

  test("deletes multiple tiles from the doc", async () => {
    await DELETE_TILES_TOOL.function({ ids: [0, 2] }, context);

    expect(tiles().has(sectionA)).toBe(false);
    expect(tiles().has(sectionB)).toBe(true);
    expect(tiles().has(sectionC)).toBe(false);
    expect(tiles().size).toBe(1);
  });
});
