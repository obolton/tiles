import { describe, expect, test } from "vitest";
import {
  createEditorState,
  cursorAfter,
  cursorBefore,
  doc,
  h2,
  mark,
  p,
  runCommand,
  selectNode,
  selectText,
  text,
  textRange,
} from "@/test/helpers/richText";

describe("rich text test helpers", () => {
  const content = doc(p("Hello ", text("world", mark("bold"))), h2({ align: "center" }, "Title"));

  test("builders accept optional attrs followed by content", () => {
    expect(content.toString()).toBe('doc(paragraph("Hello ", bold("world")), heading("Title"))');
    expect(content.lastChild?.attrs).toMatchObject({ level: 2, align: "center" });
    expect(() => p("text", { align: "center" })).toThrow(TypeError);
  });

  test("text positions are resolved within a single text node", () => {
    expect(textRange(content, "world")).toEqual({ from: 7, to: 12 });
    expect(cursorBefore(content, "world").from).toBe(7);
    expect(cursorAfter(content, "world").from).toBe(12);
    const selection = selectText(content, "Hello", "Title");
    expect([selection.from, selection.to]).toEqual([1, 19]);
    expect(() => textRange(content, "missing")).toThrow('Text "missing" not found');
  });

  test("selectNode selects the first matching node", () => {
    const selection = selectNode(content, (node) => node.type.name === "heading");
    expect(selection.node.type.name).toBe("heading");
    expect(() => selectNode(content, (node) => node.type.name === "divider")).toThrow(
      "No matching node",
    );
  });

  test("runCommand applies dispatched transactions and reports the result", () => {
    const state = createEditorState(content, selectText(content, "Hello"));
    const result = runCommand((_state, dispatch) => {
      dispatch?.(state.tr.insertText("Bye"));
      return true;
    }, state);

    expect(result.handled).toBe(true);
    expect(result.transactions).toHaveLength(1);
    expect(result.doc.firstChild?.textContent).toBe("Bye world");
  });
});
