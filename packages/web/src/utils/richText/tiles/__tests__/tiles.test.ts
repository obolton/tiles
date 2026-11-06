import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { EditorView } from "prosemirror-view";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { Slice, Fragment } from "prosemirror-model";
import { ySyncPlugin } from "y-prosemirror";
import { getTileIds } from "doc/richText/tiles";
import Image from "@/models/Image";
import { createEditor } from "@/test/editor";
import { createUndoPlugin } from "@/utils/richText/undoPlugin";
import { createState } from "@/utils/richText/state";
import { schema } from "@/utils/richText/schema";
import { selectedTileId, tilePos } from "../tiles";
import type Body from "@/models/Body";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));
// Tile components bring toolbars and icons that need a browser; the node view only needs an item.
vi.mock("@/components/item/TileContent", () => ({
  default: () => document.createElement("span"),
}));

const IMAGE = { imageId: "image-id", size: { width: 10, height: 10 } };

function tileSlice(id: string): Slice {
  return new Slice(Fragment.from(schema.nodes.tile.create({ id })), 0, 0);
}

describe("tiles plugin", () => {
  let editor: Editor;
  let body: Body;
  let view: EditorView;

  function mount(options: { body?: Body } = { body }) {
    const state = createState(
      null,
      [ySyncPlugin(body.fragment), createUndoPlugin(editor.undoManager?.manager)],
      options,
    );
    const container = document.createElement("div");
    document.body.append(container);
    view = new EditorView(container, { state });
  }

  function tilesMap() {
    return editor.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

  function createImage() {
    return editor.page.createTile(Image.createMap(IMAGE));
  }

  function selectTile(id: string) {
    const pos = tilePos(view.state.doc, id);
    if (pos === null) {
      throw new Error(`Tile ${id} is not in the document`);
    }
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
  }

  function paste(slice: Slice): Slice {
    let result = slice;
    view.someProp("transformPasted", (f) => {
      result = f(result, view, false);
    });
    return result;
  }

  beforeEach(() => {
    editor = createEditor({ page: { type: "DOCUMENT" } });
    body = editor.page.body!;
  });

  afterEach(() => {
    view?.destroy();
  });

  describe("node views", () => {
    test("renders embedded tiles as page items", () => {
      const image = createImage();
      mount();

      const item = view.dom.querySelector("page-item");
      expect(item?.id).toBe(image.id);
      expect(view.dom.querySelector(`[data-tile-id="${image.id}"]`)).not.toBeNull();
    });

    test("renders a tile whose map arrives after its node", () => {
      mount();
      const id = "late-tile";
      body.fragment.insert(0, [
        (() => {
          const element = new Y.XmlElement("tile");
          element.setAttribute("id", id);
          return element;
        })(),
      ]);
      expect(view.dom.querySelector("page-item")).toBeNull();

      const map = Image.createMap(IMAGE);
      map.set("id", id);
      map.set("parentId", null);
      tilesMap().set(id, map);

      expect(view.dom.querySelector("page-item")?.id).toBe(id);
    });
  });

  describe("garbage collection", () => {
    test("deletes the map of a removed node in the same undo step", () => {
      const image = createImage();
      mount();
      editor.undoManager?.stopCapturing();

      selectTile(image.id);
      view.dispatch(view.state.tr.deleteSelection());

      expect(getTileIds(body.fragment)).toEqual([]);
      expect(tilesMap().has(image.id)).toBe(false);

      editor.undo();

      expect(getTileIds(body.fragment)).toEqual([image.id]);
      expect(tilesMap().has(image.id)).toBe(true);
    });

    test("keeps the map of a cut node so a paste can re-attach it", () => {
      const image = createImage();
      mount();

      selectTile(image.id);
      view.dispatch(view.state.tr.deleteSelection().setMeta("uiEvent", "cut"));
      expect(tilesMap().has(image.id)).toBe(true);

      const pasted = paste(tileSlice(image.id));
      expect(pasted.content.firstChild?.attrs.id).toBe(image.id);
    });

    test("leaves the map alone when a remote peer removes the node", () => {
      const image = createImage();
      mount();

      const replica = new Y.Doc();
      Y.applyUpdate(replica, Y.encodeStateAsUpdate(editor.page.doc));
      const fragment = replica.getXmlFragment("body");
      fragment.delete(0, 1);
      Y.applyUpdate(
        editor.page.doc,
        Y.encodeStateAsUpdate(replica, Y.encodeStateVector(editor.page.doc)),
      );

      expect(getTileIds(body.fragment)).toEqual([]);
      expect(tilesMap().has(image.id)).toBe(true);
    });

    test("does not delete a map when its node is moved", () => {
      const image = createImage();
      mount();

      image.moveUp();

      expect(tilesMap().has(image.id)).toBe(true);
    });
  });

  describe("paste", () => {
    test("clones a tile that is already in the document", () => {
      const image = createImage();
      mount();

      const pasted = paste(tileSlice(image.id));

      const id = pasted.content.firstChild?.attrs.id as string;
      expect(id).not.toBe(image.id);
      expect(tilesMap().has(id)).toBe(true);
      expect(editor.page.index.get(id)?.parentId.value).toBeNull();
      expect(getTileIds(body.fragment)).toEqual([image.id]);
    });

    test("drops a tile that the page does not have", () => {
      mount();

      const pasted = paste(tileSlice("unknown"));

      expect(pasted.content.size).toBe(0);
    });

    test("strips tiles from pastes into editors without a body", () => {
      const image = createImage();
      mount({});

      const pasted = paste(tileSlice(image.id));

      expect(pasted.content.size).toBe(0);
    });
  });

  describe("selection bridge", () => {
    test("selects the tile in the page when its node is selected", () => {
      const image = createImage();
      mount();

      selectTile(image.id);

      expect(Array.from(editor.selection)).toEqual([image.id]);
      expect(selectedTileId(view.state)).toBe(image.id);
    });

    test("deselects the tile when the caret returns to text", () => {
      const image = createImage();
      mount();
      selectTile(image.id);

      view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));

      expect(editor.selection.size).toBe(0);
    });

    test("keeps a moved tile selected", () => {
      body.fragment.insert(0, [new Y.XmlElement("paragraph")]);
      const image = createImage();
      mount();
      selectTile(image.id);

      image.moveUp();

      expect(getTileIds(body.fragment)).toEqual([image.id]);
      expect(tilePos(view.state.doc, image.id)).toBe(0);
      expect(selectedTileId(view.state)).toBe(image.id);
      expect(Array.from(editor.selection)).toEqual([image.id]);
    });

    test("selects the node when the page selects the tile", () => {
      const image = createImage();
      mount();

      editor.select([image.id]);

      expect(selectedTileId(view.state)).toBe(image.id);
    });

    test("starts a new undo step only when the selected tile changes", () => {
      createImage();
      mount();
      const stopCapturing = vi.spyOn(editor.undoManager!, "stopCapturing");

      view.dispatch(view.state.tr.insertText("a", 1));
      view.dispatch(view.state.tr.insertText("b", 2));

      expect(stopCapturing).not.toHaveBeenCalled();
    });

    test("tracks the caret as the insertion point", () => {
      mount();
      body.fragment.insert(0, [new Y.XmlElement("paragraph")]);

      view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));

      expect(body.insertionPoint.value).not.toBeNull();
    });
  });
});
