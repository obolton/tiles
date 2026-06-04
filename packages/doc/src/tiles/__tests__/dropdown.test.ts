import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildDropdownMap } from "@/tiles/dropdown";

describe("buildDropdownMap", () => {
  test("defaults the title to null", () => {
    const doc = new Y.Doc();
    const map = buildDropdownMap({ options: [{ value: "a" }] });
    doc.getMap().set("dropdown", map);

    expect(map.get("title")).toBeNull();
    expect(map.get("options")).toEqual([{ value: "a" }]);
  });

  test("respects a provided title", () => {
    const doc = new Y.Doc();
    const map = buildDropdownMap({ title: "Pick", options: [] });
    doc.getMap().set("dropdown", map);

    expect(map.get("title")).toBe("Pick");
  });
});
