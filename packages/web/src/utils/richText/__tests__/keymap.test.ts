import { describe, expect, test } from "vitest";
import {
  createEditorState,
  cursorAfter,
  doc,
  li,
  p,
  runCommand,
  text,
  ul,
  mark,
} from "@/test/helpers/richText";
import { keys } from "../keymap";

describe("keymap", () => {
  describe("Tab", () => {
    test("nests the list item under its previous sibling", () => {
      const content = doc(ul(li(p("One")), li(p("Two"))));
      const { handled, doc: result } = runCommand(
        keys.Tab,
        createEditorState(content, cursorAfter(content, "Two")),
      );

      expect(handled).toBe(true);
      expect(result.toJSON()).toEqual(doc(ul(li(p("One"), ul(li(p("Two")))))).toJSON());
    });

    test("cannot nest the first item of a list", () => {
      const content = doc(ul(li(p("One")), li(p("Two"))));
      const { handled, doc: result } = runCommand(
        keys.Tab,
        createEditorState(content, cursorAfter(content, "One")),
      );

      expect(handled).toBe(false);
      expect(result.eq(content)).toBe(true);
    });

    test("indents a paragraph outside a list", () => {
      const content = doc(p("Text"));
      const { doc: result } = runCommand(
        keys.Tab,
        createEditorState(content, cursorAfter(content, "Text")),
      );

      expect(result.toJSON()).toEqual(doc(p({ indent: 1 }, "Text")).toJSON());
    });
  });

  describe("Shift-Tab", () => {
    test("lifts a nested list item into its parent list", () => {
      const content = doc(ul(li(p("One"), ul(li(p("Two"))))));
      const { handled, doc: result } = runCommand(
        keys["Shift-Tab"],
        createEditorState(content, cursorAfter(content, "Two")),
      );

      expect(handled).toBe(true);
      expect(result.toJSON()).toEqual(doc(ul(li(p("One")), li(p("Two")))).toJSON());
    });

    test("outdents a paragraph outside a list", () => {
      const content = doc(p({ indent: 2 }, "Text"));
      const { doc: result } = runCommand(
        keys["Shift-Tab"],
        createEditorState(content, cursorAfter(content, "Text")),
      );

      expect(result.toJSON()).toEqual(doc(p({ indent: 1 }, "Text")).toJSON());
    });
  });

  test("Enter splits a list item", () => {
    const content = doc(ul(li(p("OneTwo"))));
    const { handled, doc: result } = runCommand(
      keys.Enter,
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(ul(li(p("One")), li(p("Two")))).toJSON());
  });

  test("Mod-b toggles bold", () => {
    const content = doc(p("Text"));
    const initial = createEditorState(content, cursorAfter(content, "Text"));

    expect(runCommand(keys["Mod-b"], initial).state.storedMarks).toEqual([mark("bold")]);
  });

  test("Mod-e toggles inline code", () => {
    const content = doc(p(text("Text", mark("code"))));
    const initial = createEditorState(content, cursorAfter(content, "Text"));

    expect(runCommand(keys["Mod-e"], initial).state.storedMarks).toEqual([]);
  });
});
