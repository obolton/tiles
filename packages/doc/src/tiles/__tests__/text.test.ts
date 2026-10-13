import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildTextMap } from "@/tiles/text";

describe("buildTextMap", () => {
  test("sets align and an empty content fragment", () => {
    const doc = new Y.Doc();
    const map = buildTextMap({});
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("TEXT");
    expect(map.get("align")).toBe("TOP");
    const content = map.get("content");
    expect(content).toBeInstanceOf(Y.XmlFragment);
    expect(content as Y.XmlFragment).toHaveLength(0);
  });

  test("respects a provided alignment", () => {
    const doc = new Y.Doc();
    const map = buildTextMap({ align: "CENTER" });
    doc.getMap().set("tile", map);

    expect(map.get("align")).toBe("CENTER");
  });
});
