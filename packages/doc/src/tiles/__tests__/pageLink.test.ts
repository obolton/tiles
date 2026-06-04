import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildPageLinkMap } from "@/tiles/pageLink";

describe("buildPageLinkMap", () => {
  test("sets the linked page snapshot", () => {
    const doc = new Y.Doc();
    const linkedPage = { id: "p1", title: "Page" };
    const map = buildPageLinkMap({ linkedPage });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("PAGE_LINK");
    expect(map.get("linkedPage")).toEqual(linkedPage);
  });
});
