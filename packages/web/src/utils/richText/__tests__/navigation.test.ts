import { afterEach, describe, expect, test, vi } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "@/utils/richText/schema";
import { focusEdge, focusNear } from "../navigation";
import type { Node } from "prosemirror-model";

function paragraph(text = ""): Node {
  return schema.node("paragraph", null, text ? [schema.text(text)] : []);
}

function tile(id: string): Node {
  return schema.nodes.tile.create({ id });
}

let view: EditorView | null = null;

function mount(...content: Node[]): EditorView {
  const doc = schema.topNodeType.create(null, content);
  const container = document.createElement("div");
  document.body.append(container);
  view = new EditorView(container, { state: EditorState.create({ doc }) });
  return view;
}

/** The names of the document's top-level blocks. */
function blocks(view: EditorView): string[] {
  const { doc } = view.state;
  return Array.from({ length: doc.childCount }, (_, i) => doc.child(i).type.name);
}

function endPos(view: EditorView): number {
  return view.state.doc.content.size - 1;
}

function stubRect(
  view: EditorView,
  rect: { top: number; bottom: number; left: number; right: number },
) {
  const { top, bottom, left, right } = rect;
  vi.spyOn(view.dom, "getBoundingClientRect").mockReturnValue({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    top,
    right,
    bottom,
    left,
    toJSON: () => ({}),
  });
}

afterEach(() => {
  view?.destroy();
  view = null;
  document.body.replaceChildren();
});

describe("focusEdge", () => {
  test("puts the caret at the end of the last text block", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));

    expect(focusEdge(view, 1)).toBe(true);

    expect(view.state.selection).toBeInstanceOf(TextSelection);
    expect(view.state.selection.from).toBe(endPos(view));
    expect(blocks(view)).toEqual(["paragraph", "paragraph"]);
    expect(view.hasFocus()).toBe(true);
  });

  test("puts the caret at the start of the first text block", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));

    expect(focusEdge(view, -1)).toBe(true);

    expect(view.state.selection).toBeInstanceOf(TextSelection);
    expect(view.state.selection.from).toBe(1);
    expect(blocks(view)).toEqual(["paragraph", "paragraph"]);
  });

  test("adds a paragraph to land in after a trailing tile", () => {
    const view = mount(paragraph("Hello"), tile("a"));

    focusEdge(view, 1);

    expect(blocks(view)).toEqual(["paragraph", "tile", "paragraph"]);
    expect(view.state.selection).toBeInstanceOf(TextSelection);
    expect(view.state.selection.from).toBe(endPos(view));
  });

  test("adds a paragraph to land in before a leading tile", () => {
    const view = mount(tile("a"), paragraph("Hello"));

    focusEdge(view, -1);

    expect(blocks(view)).toEqual(["paragraph", "tile", "paragraph"]);
    expect(view.state.selection).toBeInstanceOf(TextSelection);
    expect(view.state.selection.from).toBe(1);
  });
});

describe("focusNear", () => {
  const rect = { top: 100, bottom: 200, left: 50, right: 150 };

  test("focuses the end when the point is below the editor", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));
    stubRect(view, rect);

    expect(focusNear(view, { clientX: 100, clientY: 300 })).toBe(true);

    expect(view.state.selection.from).toBe(endPos(view));
    expect(view.hasFocus()).toBe(true);
  });

  test("focuses the start when the point is above the editor", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));
    stubRect(view, rect);

    focusNear(view, { clientX: 100, clientY: 20 });

    expect(view.state.selection.from).toBe(1);
  });

  test("puts the caret beside the line at the point's height", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));
    stubRect(view, rect);
    // Resolves to the start of "World", the line beside the point
    const posAtCoords = vi.spyOn(view, "posAtCoords").mockReturnValue({ pos: 8, inside: 7 });

    focusNear(view, { clientX: 10, clientY: 150 });

    expect(posAtCoords).toHaveBeenCalledWith({ left: 50, top: 150 });
    expect(view.state.selection).toBeInstanceOf(TextSelection);
    expect(view.state.selection.from).toBe(8);
  });

  test("falls back to the end when no position is beside the point", () => {
    const view = mount(paragraph("Hello"), paragraph("World"));
    stubRect(view, rect);
    vi.spyOn(view, "posAtCoords").mockReturnValue(null);

    focusNear(view, { clientX: 100, clientY: 150 });

    expect(view.state.selection.from).toBe(endPos(view));
  });
});
