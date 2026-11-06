import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import {
  TILE_NODE,
  createTileElement,
  findTile,
  getTileIds,
  insertTile,
  positionAfterBlock,
  positionAfterTile,
  removeTiles,
} from "@/richText/tiles";

function element(name: string, children: (Y.XmlElement | Y.XmlText)[] = []): Y.XmlElement {
  const node = new Y.XmlElement(name);
  if (children.length > 0) {
    node.insert(0, children);
  }
  return node;
}

function text(value: string): Y.XmlText {
  const node = new Y.XmlText();
  node.insert(0, value);
  return node;
}

const paragraph = (value: string) => element("paragraph", [text(value)]);

function fragment(...nodes: Y.XmlElement[]): Y.XmlFragment {
  const content = new Y.Doc().getXmlFragment("body");
  content.insert(0, nodes);
  return content;
}

/** The fragment as nested node names, with tiles shown as `tile:<id>`. */
function outline(parent: Y.XmlFragment | Y.XmlElement): unknown[] {
  return parent.toArray().map((node) => {
    if (!(node instanceof Y.XmlElement)) {
      return "text";
    }
    if (node.nodeName === TILE_NODE) {
      return `tile:${node.getAttribute("id")}`;
    }
    return node.length > 0 && node.firstChild instanceof Y.XmlElement
      ? { [node.nodeName]: outline(node) }
      : node.nodeName;
  });
}

/** A relative position inside the text of `block`, as the editor produces for a caret. */
function caretIn(block: Y.XmlElement): Y.RelativePosition {
  const content = block.firstChild;
  if (!(content instanceof Y.XmlText)) {
    throw new Error("Block has no text");
  }
  return Y.createRelativePositionFromTypeIndex(content, 1);
}

describe("createTileElement", () => {
  test("creates a tile element carrying the id", () => {
    const tile = createTileElement("t1");
    fragment(tile);

    expect(tile.nodeName).toBe(TILE_NODE);
    expect(tile.getAttribute("id")).toBe("t1");
  });
});

describe("getTileIds", () => {
  test("lists tiles at any depth in document order", () => {
    const content = fragment(
      createTileElement("a"),
      element("quote", [paragraph("q"), createTileElement("b")]),
      element("unordered_list", [element("list_item", [paragraph("i"), createTileElement("c")])]),
      paragraph("p"),
      createTileElement("d"),
    );

    expect(getTileIds(content)).toEqual(["a", "b", "c", "d"]);
  });

  test("is empty without tiles", () => {
    expect(getTileIds(fragment(paragraph("p")))).toEqual([]);
  });
});

describe("findTile", () => {
  test("finds a nested tile by id", () => {
    const content = fragment(element("quote", [paragraph("q"), createTileElement("b")]));

    expect(findTile(content, "b")?.getAttribute("id")).toBe("b");
    expect(findTile(content, "missing")).toBeNull();
  });
});

describe("insertTile", () => {
  test("appends to the fragment followed by an empty paragraph", () => {
    const content = fragment(paragraph("p"));

    insertTile(content, "t1");

    expect(outline(content)).toEqual(["paragraph", "tile:t1", "paragraph"]);
  });

  test("inserts at a position between blocks", () => {
    const content = fragment(paragraph("first"), paragraph("second"));

    insertTile(content, "t1", Y.createRelativePositionFromTypeIndex(content, 1));

    expect(outline(content)).toEqual(["paragraph", "tile:t1", "paragraph"]);
  });

  test("inserts between the children of a block", () => {
    const item = element("list_item", [paragraph("item")]);
    const content = fragment(element("unordered_list", [item]));

    insertTile(content, "t1", Y.createRelativePositionFromTypeIndex(item, 1));

    expect(outline(content)).toEqual([
      { unordered_list: [{ list_item: ["paragraph", "tile:t1"] }] },
    ]);
  });

  test("adds a trailing paragraph when inserting at the end", () => {
    const content = fragment(paragraph("first"));

    insertTile(content, "t1", Y.createRelativePositionFromTypeIndex(content, 1));

    expect(outline(content)).toEqual(["paragraph", "tile:t1", "paragraph"]);
  });

  test("appends for a position inside text", () => {
    const first = paragraph("first");
    const content = fragment(first, paragraph("second"));

    insertTile(content, "t1", caretIn(first));

    expect(outline(content)).toEqual(["paragraph", "paragraph", "tile:t1", "paragraph"]);
  });

  test("appends when the position cannot be resolved", () => {
    const content = fragment(paragraph("p"));
    const other = fragment(paragraph("elsewhere"));

    insertTile(content, "t1", Y.createRelativePositionFromTypeIndex(other, 0));

    expect(outline(content)).toEqual(["paragraph", "tile:t1", "paragraph"]);
  });
});

describe("positionAfterBlock", () => {
  test("points after the top-level block containing the position", () => {
    const item = paragraph("item");
    const content = fragment(
      element("unordered_list", [element("list_item", [item])]),
      paragraph("after"),
    );

    const at = positionAfterBlock(content, caretIn(item));
    insertTile(content, "t1", at ?? undefined);

    expect(outline(content)).toEqual([
      { unordered_list: [{ list_item: ["paragraph"] }] },
      "tile:t1",
      "paragraph",
    ]);
  });

  test("keeps a position between top-level blocks", () => {
    const content = fragment(paragraph("first"), paragraph("second"));

    const at = positionAfterBlock(content, Y.createRelativePositionFromTypeIndex(content, 1));
    insertTile(content, "t1", at ?? undefined);

    expect(outline(content)).toEqual(["paragraph", "tile:t1", "paragraph"]);
  });

  test("is null when the position cannot be resolved", () => {
    const content = fragment(paragraph("p"));
    const other = fragment(paragraph("elsewhere"));

    expect(positionAfterBlock(content, Y.createRelativePositionFromTypeIndex(other, 0))).toBeNull();
  });
});

describe("positionAfterTile", () => {
  test("positions the next tile directly after an existing one", () => {
    const content = fragment(paragraph("p"), createTileElement("a"), paragraph("q"));

    const at = positionAfterTile(content, "a");
    insertTile(content, "b", at ?? undefined);

    expect(outline(content)).toEqual(["paragraph", "tile:a", "tile:b", "paragraph"]);
  });

  test("is null for an unknown tile", () => {
    expect(positionAfterTile(fragment(paragraph("p")), "missing")).toBeNull();
  });
});

describe("removeTiles", () => {
  test("removes tiles at any depth and leaves the rest", () => {
    const content = fragment(
      createTileElement("a"),
      element("quote", [paragraph("q"), createTileElement("b")]),
      paragraph("p"),
    );

    removeTiles(content, ["a", "b", "missing"]);

    expect(outline(content)).toEqual([{ quote: ["paragraph"] }, "paragraph"]);
  });
});
