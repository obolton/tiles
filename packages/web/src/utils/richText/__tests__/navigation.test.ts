import { afterEach, describe, expect, test, vi } from "vitest";
import { EditorView } from "prosemirror-view";
import { Selection } from "prosemirror-state";
import { TextAlignment, TextFormat } from "doc/types/richText";
import { createState } from "@/utils/richText/state";
import { focusNear } from "../navigation";
import type { RichText } from "doc/types/richText";

const RECT = {
  top: 100,
  right: 450,
  bottom: 300,
  left: 50,
  width: 400,
  height: 200,
} as DOMRect;

function paragraph(text: string): RichText[number] {
  return {
    type: "paragraph",
    align: TextAlignment.LEFT,
    children: [{ type: "text", text, format: TextFormat.NONE }],
  };
}

describe("focusNear", () => {
  let view: EditorView;

  function mount(content: RichText = [paragraph("Hello"), paragraph("World")]) {
    const container = document.createElement("div");
    document.body.append(container);
    view = new EditorView(container, { state: createState(content) });
    vi.spyOn(view.dom, "getBoundingClientRect").mockReturnValue(RECT);
    vi.spyOn(view, "focus");
  }

  afterEach(() => {
    view.destroy();
    document.body.replaceChildren();
  });

  test("puts the caret at the start above the content", () => {
    mount();

    focusNear(view, { x: 100, y: 50 });

    expect(view.state.selection.from).toBe(Selection.atStart(view.state.doc).from);
    expect(view.focus).toHaveBeenCalled();
  });

  test("puts the caret at the end below the content", () => {
    mount();

    focusNear(view, { x: 100, y: 350 });

    expect(view.state.selection.from).toBe(Selection.atEnd(view.state.doc).from);
    expect(view.focus).toHaveBeenCalled();
  });

  test("puts the caret on the nearest line beside the content", () => {
    mount();
    const posAtCoords = vi.spyOn(view, "posAtCoords").mockReturnValue({ pos: 9, inside: 7 });

    focusNear(view, { x: 10, y: 250 });

    expect(posAtCoords).toHaveBeenCalledWith({ left: 51, top: 250 });
    expect(view.state.selection.from).toBe(9);
  });

  test("falls back to the end beside content without a position", () => {
    mount();
    vi.spyOn(view, "posAtCoords").mockReturnValue(null);

    focusNear(view, { x: 500, y: 250 });

    expect(view.state.selection.from).toBe(Selection.atEnd(view.state.doc).from);
  });
});
