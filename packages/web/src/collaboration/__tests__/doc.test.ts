import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { initializeDoc } from "../doc";
import { PAGE } from "@/test/fixtures/Page";

function encodeSnapshot(doc: Y.Doc): string {
  return Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64");
}

describe("initializeDoc", () => {
  test("returns a Y.Doc populated from the snapshot", () => {
    const source = new Y.Doc();
    source.getMap("metadata").set("themeId", "theme-1");
    source.getMap("tiles").set("tile-1", new Y.Map());

    const result = initializeDoc({ ...PAGE, document: encodeSnapshot(source) });

    expect(result.getMap("metadata").get("themeId")).toBe("theme-1");
    expect(result.getMap("tiles").has("tile-1")).toBe(true);
  });

  test("returns a fresh Y.Doc instance", () => {
    const source = new Y.Doc();

    const result = initializeDoc({ ...PAGE, document: encodeSnapshot(source) });

    expect(result).toBeInstanceOf(Y.Doc);
    expect(result).not.toBe(source);
  });
});
