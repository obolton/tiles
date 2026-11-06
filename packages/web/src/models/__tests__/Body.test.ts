import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { getTileIds, TILE_NODE } from "doc/richText/tiles";
import Image from "@/models/Image";
import Section from "@/models/Section";
import Text from "@/models/Text";
import { createEditor } from "@/test/editor";
import type Body from "@/models/Body";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

const IMAGE = { imageId: "image-id", size: { width: 10, height: 10 } };

function paragraph(value: string): Y.XmlElement {
  const text = new Y.XmlText();
  text.insert(0, value);
  const element = new Y.XmlElement("paragraph");
  element.insert(0, [text]);
  return element;
}

describe("Body", () => {
  let editor: Editor;
  let body: Body;

  beforeEach(() => {
    editor = createEditor({ page: { type: "DOCUMENT" } });
    body = editor.page.body!;
  });

  function outline(): string[] {
    return body.fragment.toArray().map((node) => {
      const element = node as Y.XmlElement;
      return element.nodeName === TILE_NODE
        ? `tile:${element.getAttribute("id")}`
        : element.nodeName;
    });
  }

  function tilesMap() {
    return editor.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

  test("is the container for root tiles", () => {
    expect(editor.page.container(null)).toBe(body);
    expect(editor.page.container("section-id")).toBe(editor.page.placement);
  });

  describe("insert", () => {
    test("appends the tile's node followed by a paragraph", () => {
      body.fragment.insert(0, [paragraph("Intro")]);

      const image = editor.page.createTile(Image.createMap(IMAGE));

      expect(image.parentId.value).toBeNull();
      expect(tilesMap().get(image.id)?.has("order")).toBe(false);
      expect(outline()).toEqual(["paragraph", `tile:${image.id}`, "paragraph"]);
      expect(body.tileIds).toEqual([image.id]);
      expect(editor.page.tiles.value).toHaveLength(0);
    });

    test("inserts after the block at the given position", () => {
      const first = paragraph("First");
      body.fragment.insert(0, [first, paragraph("Second")]);
      const at = Y.createRelativePositionFromTypeIndex(first.firstChild as Y.XmlText, 0);

      const image = editor.page.createTile(Image.createMap(IMAGE), { at });

      expect(outline()).toEqual(["paragraph", `tile:${image.id}`, "paragraph"]);
    });

    test("adopts a tile whose node the body already holds", () => {
      const image = editor.page.createTile(Image.createMap(IMAGE), { at: null });

      expect(editor.page.index.get(image.id)).toBe(image);
      expect(outline()).toEqual([]);
    });

    test("records one undo step", () => {
      editor.undoManager?.stopCapturing();

      const image = editor.page.createTile(Image.createMap(IMAGE));
      editor.undo();

      expect(tilesMap().has(image.id)).toBe(false);
      expect(outline()).toEqual([]);
    });
  });

  describe("remove", () => {
    test("removes the node and the map together", () => {
      const image = editor.page.createTile(Image.createMap(IMAGE));
      editor.undoManager?.stopCapturing();

      body.remove([image]);

      expect(tilesMap().has(image.id)).toBe(false);
      expect(editor.page.index.has(image.id)).toBe(false);
      expect(outline()).toEqual(["paragraph"]);

      editor.undo();
      expect(tilesMap().has(image.id)).toBe(true);
      expect(outline()).toEqual([`tile:${image.id}`, "paragraph"]);
    });
  });

  describe("moveUp and moveDown", () => {
    test("reorders the tile among the body's blocks", () => {
      body.fragment.insert(0, [paragraph("Intro")]);
      const image = editor.page.createTile(Image.createMap(IMAGE));

      image.moveUp();
      expect(outline()).toEqual([`tile:${image.id}`, "paragraph", "paragraph"]);

      image.moveDown();
      expect(outline()).toEqual(["paragraph", `tile:${image.id}`, "paragraph"]);
    });
  });

  describe("duplicate", () => {
    test("copies the tile directly after itself with its children", () => {
      const section = editor.page.createTile(Section.createMap({ layout: "GRID" })) as Section;
      const child = editor.page.createTile(Text.createMap({}), { parentId: section.id });

      const copy = section.duplicate() as Section;

      expect(copy.id).not.toBe(section.id);
      expect(copy.embedded).toBe(true);
      expect(outline()).toEqual([`tile:${section.id}`, `tile:${copy.id}`, "paragraph"]);
      expect(copy.tiles.value).toHaveLength(1);
      expect(copy.tiles.value[0]?.id).not.toBe(child.id);
    });
  });

  test("positionAfter points after an embedded tile", () => {
    const first = editor.page.createTile(Image.createMap(IMAGE));
    const second = editor.page.createTile(Image.createMap(IMAGE), {
      at: body.positionAfter(first.id) ?? undefined,
    });

    expect(getTileIds(body.fragment)).toEqual([first.id, second.id]);
    expect(body.contains(second.id)).toBe(true);
    expect(body.contains("missing")).toBe(false);
  });
});
