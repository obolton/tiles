import { describe, expect, test } from "vitest";
import {
  DOCK_PARENT_PREFIX,
  dockParentId,
  parseParentId,
} from "@/models/parentId";

describe("dockParentId", () => {
  test("prefixes the edge", () => {
    expect(dockParentId("TOP")).toBe(`${DOCK_PARENT_PREFIX}TOP`);
    expect(dockParentId("BOTTOM")).toBe("dock:BOTTOM");
  });
});

describe("parseParentId", () => {
  test("classifies null as the page root", () => {
    expect(parseParentId(null)).toEqual({ type: "root" });
  });

  test("classifies a dock parentId", () => {
    expect(parseParentId("dock:LEFT")).toEqual({ type: "dock", edge: "LEFT" });
    expect(parseParentId(dockParentId("RIGHT"))).toEqual({
      type: "dock",
      edge: "RIGHT",
    });
  });

  test("classifies a uuid as a section", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(parseParentId(id)).toEqual({ type: "section", sectionId: id });
  });

  test("falls back to root for an unrecognised dock edge", () => {
    expect(parseParentId("dock:MIDDLE")).toEqual({ type: "root" });
  });

  test("round-trips every dock edge", () => {
    for (const edge of ["TOP", "LEFT", "RIGHT", "BOTTOM"] as const) {
      expect(parseParentId(dockParentId(edge))).toEqual({
        type: "dock",
        edge,
      });
    }
  });
});
