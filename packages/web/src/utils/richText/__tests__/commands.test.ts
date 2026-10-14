import { describe, expect, test, vi } from "vitest";
import { NodeSelection, Plugin } from "prosemirror-state";
import { GapCursor } from "prosemirror-gapcursor";
import { MAX_INDENT } from "@/constants/formatting";
import { schema } from "../schema";
import { PROMPT_PLUGIN_KEY } from "../pluginKeys";
import { MENTION_PLUGIN_KEY, mentions } from "../mentions";
import { lists } from "../lists";
import * as commands from "../commands";
import {
  bold,
  checkList,
  codeBlock,
  createState,
  date,
  divider,
  doc,
  dropdown,
  h,
  italic,
  li,
  link,
  mention,
  ol,
  p,
  pendingBlock,
  quote,
  run,
  text,
  ul,
  withView,
} from "./builders";
import type { Node } from "prosemirror-model";

const COLOR = "ff0000ff0000";

function nodeSelection(node: Node, pos: number) {
  return NodeSelection.create(node, pos);
}

/** An empty selection that is not inside a text block. */
function gapCursor(node: Node, pos: number) {
  return new GapCursor(node.resolve(pos));
}

const inCode = () => createState(doc(p("Text"), codeBlock("ls")), 8);

const atEnd = () => createState(doc(p("Hi ")), 4);

const withPending = () => createState(doc(p("Before"), pendingBlock(p("Draft"), h(2, "Soon"))), 10);

// Tracks the open position like the real prompt plugin, without its DOM widget.
const promptState = () =>
  new Plugin<number | null>({
    key: PROMPT_PLUGIN_KEY,
    state: {
      init: () => null,
      apply(tr, value) {
        const meta = tr.getMeta(PROMPT_PLUGIN_KEY) as { pos: number | null } | undefined;
        return meta ? meta.pos : value;
      },
    },
  });

describe("addMark", () => {
  test("stores the mark on a collapsed selection", () => {
    const { result, state } = run(commands.addMark(bold), createState(doc(p("Hello")), 3));
    expect(result).toBe(true);
    expect(state.storedMarks).toEqual([bold]);
    expect(state.doc.eq(doc(p("Hello")))).toBe(true);
  });

  test("applies the mark across a ranged selection", () => {
    const { state } = run(commands.addMark(bold), createState(doc(p("Hello world")), "world"));
    expect(state.doc.eq(doc(p(["Hello ", text("world", bold)])))).toBe(true);
  });

  test("returns true without dispatching", () => {
    expect(commands.addMark(bold)(createState(doc(p("Hello"))))).toBe(true);
  });
});

describe("removeMark", () => {
  test("removes the mark across the selection", () => {
    const initial = createState(doc(p(text("Hello", bold))), "ell");
    const { result, state } = run(commands.removeMark(bold), initial);
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p([text("H", bold), "ell", text("o", bold)])))).toBe(true);
  });

  test("clears a stored mark on a collapsed selection", () => {
    const initial = createState(doc(p("Hello")), 3);
    const stored = initial.apply(initial.tr.addStoredMark(bold));
    const { state } = run(commands.removeMark(bold), stored);
    expect(state.storedMarks).toEqual([]);
  });

  test("accepts a mark type", () => {
    const color = schema.marks.color.create({ color: COLOR });
    const { state } = run(commands.removeTextColor, createState(doc(p(text("Red", color))), "Red"));
    expect(state.doc.eq(doc(p("Red")))).toBe(true);
  });

  test("leaves other stored marks in place", () => {
    const initial = createState(doc(p("Hello")), 2);
    const stored = initial.apply(initial.tr.setStoredMarks([bold, italic]));
    const { state } = run(commands.removeMark(bold), stored);
    expect(state.storedMarks).toEqual([italic]);
  });

  test("returns true without dispatching", () => {
    expect(commands.removeMark(bold)(createState(doc(p("Hello"))))).toBe(true);
  });
});

describe("text attribute marks", () => {
  test("setTextSize applies a size mark", () => {
    const { state } = run(commands.setTextSize(1.5), createState(doc(p("Big")), "Big"));
    const size = schema.marks.size.create({ size: 1.5 });
    expect(state.doc.eq(doc(p(text("Big", size))))).toBe(true);
  });

  test("setTextColor applies a color mark", () => {
    const { state } = run(commands.setTextColor(COLOR), createState(doc(p("Red")), "Red"));
    const color = schema.marks.color.create({ color: COLOR });
    expect(state.doc.eq(doc(p(text("Red", color))))).toBe(true);
  });

  test("setFont applies a font mark", () => {
    const { state } = run(commands.setFont("lora"), createState(doc(p("Serif")), "Serif"));
    const font = schema.marks.font.create({ font: "lora" });
    expect(state.doc.eq(doc(p(text("Serif", font))))).toBe(true);
  });
});

describe("mark toggles", () => {
  test.each([
    ["toggleBold", commands.toggleBold, schema.marks.bold],
    ["toggleItalic", commands.toggleItalic, schema.marks.italic],
    ["toggleUnderline", commands.toggleUnderline, schema.marks.underline],
    ["toggleStrikethrough", commands.toggleStrikethrough, schema.marks.strikethrough],
    ["toggleHighlight", commands.toggleHighlight, schema.marks.highlight],
    ["toggleSuperscript", commands.toggleSuperscript, schema.marks.superscript],
    ["toggleSubscript", commands.toggleSubscript, schema.marks.subscript],
    ["toggleSmallCaps", commands.toggleSmallCaps, schema.marks.smallCaps],
    ["toggleInlineCode", commands.toggleInlineCode, schema.marks.code],
  ])("%s adds and then removes the mark", (_, command, markType) => {
    const { result, state: marked } = run(command, createState(doc(p("Hello")), "ell"));
    expect(result).toBe(true);
    expect(marked.doc.eq(doc(p(["H", text("ell", markType.create()), "o"])))).toBe(true);

    const { state: unmarked } = run(command, createState(marked.doc, "ell"));
    expect(unmarked.doc.eq(doc(p("Hello")))).toBe(true);
  });

  test("superscript replaces subscript", () => {
    const subscript = schema.marks.subscript.create();
    const { state } = run(
      commands.toggleSuperscript,
      createState(doc(p(text("x", subscript))), "x"),
    );
    expect(state.doc.eq(doc(p(text("x", schema.marks.superscript.create()))))).toBe(true);
  });
});

describe("addLink", () => {
  test("returns false for an empty href", () => {
    const dispatch = vi.fn();
    expect(commands.addLink("")(createState(doc(p("docs")), "docs"), dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("returns false for a collapsed selection", () => {
    const dispatch = vi.fn();
    expect(commands.addLink("https://example.com")(createState(doc(p("docs")), 2), dispatch)).toBe(
      false,
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("wraps the selected text in a link, keeping its marks", () => {
    const initial = createState(doc(p(["See ", text("the docs", bold), "."])), "the docs");
    const { result, state } = run(commands.addLink("https://example.com"), initial);
    expect(result).toBe(true);
    expect(
      state.doc.eq(doc(p(["See ", link("https://example.com", text("the docs", bold)), "."]))),
    ).toBe(true);
  });

  test("returns true without dispatching", () => {
    expect(commands.addLink("https://example.com")(createState(doc(p("docs")), "docs"))).toBe(true);
  });
});

describe("removeLink", () => {
  const linked = doc(p(["See ", link("https://example.com", "docs"), "."]));

  test("unwraps the link around the cursor", () => {
    const { result, state } = run(commands.removeLink, createState(linked, "oc"));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("See docs.")))).toBe(true);
  });

  test("returns false outside a link", () => {
    const dispatch = vi.fn();
    expect(commands.removeLink(createState(linked, "See"), dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("returns true without dispatching", () => {
    expect(commands.removeLink(createState(linked, "oc"))).toBe(true);
  });
});

describe("toggleQuote", () => {
  test("wraps the block in a quote", () => {
    const { result, state } = run(commands.toggleQuote, createState(doc(p("Quoted")), 2));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(quote(p("Quoted"))))).toBe(true);
  });

  test("lifts the block out of a quote", () => {
    const { result, state } = run(commands.toggleQuote, createState(doc(quote(p("Quoted"))), 3));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Quoted")))).toBe(true);
  });

  test("wraps every selected block", () => {
    const { state } = run(commands.toggleQuote, createState(doc(p("One"), p("Two")), [2, 7]));
    expect(state.doc.eq(doc(quote(p("One"), p("Two"))))).toBe(true);
  });
});

describe("toggleCode", () => {
  test("converts the block to a code block and drops marks", () => {
    const { result, state } = run(commands.toggleCode, createState(doc(p(text("Hi", bold))), 2));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(codeBlock("Hi")))).toBe(true);
  });

  test("returns true without dispatching", () => {
    expect(commands.toggleCode(createState(doc(p("Hi")), 2))).toBe(true);
  });
});

describe("toggleHeading", () => {
  test("converts a paragraph to a heading and keeps its block style", () => {
    const initial = createState(doc(p("Title", { align: "center", indent: 2 })), 2);
    withView(initial, (view) => {
      expect(commands.toggleHeading(2)(view.state, view.dispatch, view)).toBe(true);
      expect(view.state.doc.eq(doc(h(2, "Title", { align: "center", indent: 2 })))).toBe(true);
    });
  });

  test("converts a heading of the same level back to a paragraph", () => {
    const initial = createState(
      doc(h(2, "Title", { align: "right", lineHeight: 2, indent: 1, theme: "accent" })),
      2,
    );
    const { result, state } = run(commands.toggleHeading(2), initial);
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Title", { align: "right", lineHeight: 2, indent: 1 })))).toBe(true);
  });

  test("changes the level of a heading of a different level", () => {
    const initial = createState(doc(h(1, "Title", { align: "center" })), 2);
    withView(initial, (view) => {
      expect(commands.toggleHeading(3)(view.state, view.dispatch, view)).toBe(true);
      expect(view.state.doc.eq(doc(h(3, "Title", { align: "center" })))).toBe(true);
    });
  });

  test("lifts a list item out of its list before converting it", () => {
    withView(createState(doc(ul(li(p("Item")))), 3, [lists()]), (view) => {
      expect(commands.toggleHeading(1)(view.state, view.dispatch, view)).toBe(true);
      expect(view.state.doc.eq(doc(h(1, "Item")))).toBe(true);
    });
  });

  test("converts every selected block", () => {
    withView(createState(doc(p("One"), p("Two")), [2, 7]), (view) => {
      expect(commands.toggleHeading(2)(view.state, view.dispatch, view)).toBe(true);
      expect(view.state.doc.eq(doc(h(2, "One"), h(2, "Two")))).toBe(true);
    });
  });

  test("returns false without a view when converting to a heading", () => {
    expect(commands.toggleHeading(1)(createState(doc(p("Title")), 2))).toBe(false);
  });

  test("returns true without dispatching", () => {
    withView(createState(doc(p("Title")), 2), (view) => {
      expect(commands.toggleHeading(1)(view.state, undefined, view)).toBe(true);
      expect(view.state.doc.eq(doc(p("Title")))).toBe(true);
    });
    expect(commands.toggleHeading(1)(createState(doc(h(1, "Title")), 2))).toBe(true);
  });
});

describe("resetBlockFormat", () => {
  test("converts to a paragraph keeping alignment and line height", () => {
    const initial = createState(
      doc(h(2, "Title", { align: "right", lineHeight: 2, indent: 3, theme: "accent" })),
      2,
    );
    const { result, state } = run(commands.resetBlockFormat, initial);
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Title", { align: "right", lineHeight: 2 })))).toBe(true);
  });

  test("converts a code block to a paragraph", () => {
    const { state } = run(commands.resetBlockFormat, createState(doc(codeBlock("ls")), 2));
    expect(state.doc.eq(doc(p("ls")))).toBe(true);
  });

  test("returns true without dispatching", () => {
    expect(commands.resetBlockFormat(createState(doc(h(1, "Title")), 2))).toBe(true);
  });
});

describe("toggleList", () => {
  test.each([
    ["toggleOrderedList", commands.toggleOrderedList, ol],
    ["toggleUnorderedList", commands.toggleUnorderedList, ul],
    ["toggleCheckList", commands.toggleCheckList, checkList],
  ])("%s wraps a paragraph in a list and lifts it back out", (_, command, list) => {
    const { result, state: wrapped } = run(command, createState(doc(p("Item")), 2));
    expect(result).toBe(true);
    expect(wrapped.doc.eq(doc(list(li(p("Item")))))).toBe(true);

    const { result: lifted, state: unwrapped } = run(command, createState(wrapped.doc, 3));
    expect(lifted).toBe(true);
    expect(unwrapped.doc.eq(doc(p("Item")))).toBe(true);
  });

  test("wraps each selected block in its own list item", () => {
    const { state } = run(
      commands.toggleUnorderedList,
      createState(doc(p("One"), p("Two")), [2, 7]),
    );
    expect(state.doc.eq(doc(ul(li(p("One")), li(p("Two")))))).toBe(true);
  });

  test("converts a heading to a paragraph before wrapping it", () => {
    const { state } = run(
      commands.toggleUnorderedList,
      createState(doc(h(1, "Title", { align: "center" })), 2),
    );
    expect(state.doc.eq(doc(ul(li(p("Title")))))).toBe(true);
  });

  test("switches the list type of the enclosing list", () => {
    const initial = createState(doc(ul(li(p("Item"), { checked: true }))), 3);
    const { result, state } = run(commands.toggleOrderedList, initial);
    expect(result).toBe(true);
    expect(state.doc.eq(doc(ol(li(p("Item"), { checked: true }))))).toBe(true);
  });

  test("switches the innermost list of a nested list", () => {
    const nested = doc(ol(li([p("Parent"), ul(li(p("Child")))])));
    const { state } = run(commands.toggleCheckList, createState(nested, "Child"));
    expect(state.doc.eq(doc(ol(li([p("Parent"), checkList(li(p("Child")))]))))).toBe(true);
  });

  test("returns false when the selection cannot be wrapped", () => {
    const only = doc(divider());
    const dispatch = vi.fn();
    const state = createState(only, nodeSelection(only, 0));
    expect(commands.toggleUnorderedList(state, dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("returns true without dispatching", () => {
    expect(commands.toggleOrderedList(createState(doc(p("Item")), 2))).toBe(true);
    expect(commands.toggleOrderedList(createState(doc(ul(li(p("Item")))), 3))).toBe(true);
  });
});

describe("adjustIndent", () => {
  test("indent adds one level", () => {
    const { result, state } = run(commands.indent, createState(doc(p("Text")), 2));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Text", { indent: 1 })))).toBe(true);
  });

  test("indent stops at the maximum", () => {
    const initial = createState(doc(p("Text", { indent: MAX_INDENT })), 2);
    const { state } = run(commands.indent, initial);
    expect(state.doc.eq(initial.doc)).toBe(true);
  });

  test("outdent removes the attribute at the first level", () => {
    const { state } = run(commands.outdent, createState(doc(p("Text", { indent: 1 })), 2));
    expect(state.doc.eq(doc(p("Text")))).toBe(true);
    expect(state.doc.firstChild?.attrs.indent).toBeUndefined();
  });

  test("outdent stops at zero", () => {
    const initial = createState(doc(p("Text")), 2);
    const { state } = run(commands.outdent, initial);
    expect(state.doc.eq(initial.doc)).toBe(true);
  });

  test("applies to every text block in the selection", () => {
    const initial = createState(doc(p("One"), h(2, "Two"), p("Three")), [2, 10]);
    const { state } = run(commands.adjustIndent(2), initial);
    expect(state.doc.eq(doc(p("One", { indent: 2 }), h(2, "Two", { indent: 2 }), p("Three")))).toBe(
      true,
    );
  });

  test("returns true without dispatching", () => {
    expect(commands.indent(createState(doc(p("Text")), 2))).toBe(true);
  });
});

describe("setAlignment", () => {
  test("aligns the block around a collapsed selection", () => {
    const { result, state } = run(
      commands.setAlignment("center"),
      createState(doc(p("One"), p("Two")), 2),
    );
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("One", { align: "center" }), p("Two")))).toBe(true);
  });

  test("aligns every text block in a ranged selection", () => {
    const { state } = run(
      commands.setAlignment("right"),
      createState(doc(p("One"), h(1, "Two")), [2, 7]),
    );
    expect(state.doc.eq(doc(p("One", { align: "right" }), h(1, "Two", { align: "right" })))).toBe(
      true,
    );
  });

  test("returns false when the cursor is not in a text block", () => {
    const only = doc(divider());
    const dispatch = vi.fn();
    const state = createState(only, gapCursor(only, 0));
    expect(commands.setAlignment("center")(state, dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("returns true without dispatching", () => {
    expect(commands.setAlignment("center")(createState(doc(p("One")), 2))).toBe(true);
    expect(commands.setAlignment("center")(createState(doc(p("One")), "One"))).toBe(true);
  });
});

describe("setLineHeight", () => {
  test("sets the line height of the block around a collapsed selection", () => {
    const { result, state } = run(
      commands.setLineHeight(1.5),
      createState(doc(p("One"), p("Two")), 2),
    );
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("One", { lineHeight: 1.5 }), p("Two")))).toBe(true);
  });

  test("sets the line height of every text block in a ranged selection", () => {
    const { state } = run(commands.setLineHeight(2), createState(doc(p("One"), p("Two")), [2, 7]));
    expect(state.doc.eq(doc(p("One", { lineHeight: 2 }), p("Two", { lineHeight: 2 })))).toBe(true);
  });

  test("clears the line height with undefined", () => {
    const { state } = run(
      commands.setLineHeight(undefined),
      createState(doc(p("One", { lineHeight: 1.5 })), 2),
    );
    expect(state.doc.eq(doc(p("One")))).toBe(true);
  });

  test("returns false when the cursor is not in a text block", () => {
    const only = doc(divider());
    expect(commands.setLineHeight(1.5)(createState(only, gapCursor(only, 0)), vi.fn())).toBe(false);
  });

  test("returns true without dispatching", () => {
    expect(commands.setLineHeight(1.5)(createState(doc(p("One")), 2))).toBe(true);
    expect(commands.setLineHeight(1.5)(createState(doc(p("One")), "One"))).toBe(true);
  });
});

describe("code block attributes", () => {
  test("setCodeBlockLanguage sets the language of the enclosing code block", () => {
    const { result, state } = run(commands.setCodeBlockLanguage("sh"), inCode());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Text"), codeBlock("ls", { language: "sh" })))).toBe(true);
  });

  test("setCodeBlockLanguage returns false outside a code block", () => {
    const dispatch = vi.fn();
    expect(commands.setCodeBlockLanguage("sh")(createState(doc(p("Text")), 2), dispatch)).toBe(
      false,
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("toggleCodeBlockLineNumbers toggles line numbers on and off", () => {
    const { result, state: on } = run(commands.toggleCodeBlockLineNumbers, inCode());
    expect(result).toBe(true);
    expect(on.doc.eq(doc(p("Text"), codeBlock("ls", { lineNumbers: true })))).toBe(true);

    const { state: off } = run(commands.toggleCodeBlockLineNumbers, createState(on.doc, 8));
    expect(off.doc.eq(doc(p("Text"), codeBlock("ls")))).toBe(true);
  });

  test("toggleCodeBlockLineNumbers returns false outside a code block", () => {
    expect(commands.toggleCodeBlockLineNumbers(createState(doc(p("Text")), 2))).toBe(false);
  });

  test("return true without dispatching", () => {
    expect(commands.setCodeBlockLanguage("sh")(inCode())).toBe(true);
    expect(commands.toggleCodeBlockLineNumbers(inCode())).toBe(true);
  });
});

describe("inline node insertion", () => {
  test("insertDateTime inserts a date node at the cursor", () => {
    const value = new Date("2026-10-13T09:30:00.000Z");
    const { result, state } = run(commands.insertDateTime(value, false), atEnd());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p(["Hi ", date("2026-10-13T09:30:00.000Z", false)])))).toBe(true);
  });

  test("insertDateTime includes the time by default", () => {
    const value = new Date("2026-10-13T09:30:00.000Z");
    const { state } = run(commands.insertDateTime(value), atEnd());
    expect(state.doc.eq(doc(p(["Hi ", date("2026-10-13T09:30:00.000Z", true)])))).toBe(true);
  });

  test("insertDropdown inserts a dropdown node", () => {
    const { result, state } = run(commands.insertDropdown("status", "Done"), atEnd());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p(["Hi ", dropdown("status", "Done")])))).toBe(true);
  });

  test("insertMention inserts a mention node", () => {
    const { result, state } = run(commands.insertMention("user-1", "Ada"), atEnd());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p(["Hi ", mention("user-1", "Ada")])))).toBe(true);
  });

  test("inserted nodes replace the selected text", () => {
    const { state } = run(
      commands.insertMention("user-1", "Ada"),
      createState(doc(p("Hi @")), "@"),
    );
    expect(state.doc.eq(doc(p(["Hi ", mention("user-1", "Ada")])))).toBe(true);
  });

  test("insertDivider inserts a divider between blocks", () => {
    const { result, state } = run(commands.insertDivider, createState(doc(p("One"), p("Two")), 5));
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("One"), divider(), p("Two")))).toBe(true);
  });

  test("return true without dispatching", () => {
    expect(commands.insertDateTime(new Date())(atEnd())).toBe(true);
    expect(commands.insertDropdown("status", "Done")(atEnd())).toBe(true);
    expect(commands.insertMention("user-1", "Ada")(atEnd())).toBe(true);
    expect(commands.insertDivider(atEnd())).toBe(true);
  });
});

describe("pending content", () => {
  test("approve unwraps the pending block", () => {
    const { result, state } = run(commands.approve, withPending());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Before"), p("Draft"), h(2, "Soon")))).toBe(true);
  });

  test("reject deletes the pending block", () => {
    const { result, state } = run(commands.reject, withPending());
    expect(result).toBe(true);
    expect(state.doc.eq(doc(p("Before")))).toBe(true);
  });

  test("both return false outside pending content", () => {
    const dispatch = vi.fn();
    expect(commands.approve(createState(doc(p("Before")), 2), dispatch)).toBe(false);
    expect(commands.reject(createState(doc(p("Before")), 2), dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("both return true without dispatching", () => {
    expect(commands.approve(withPending())).toBe(true);
    expect(commands.reject(withPending())).toBe(true);
  });
});

describe("togglePrompt", () => {
  test("opens the prompt at the end of the selection", () => {
    const initial = createState(doc(p("Hello")), "ell", [promptState()]);
    const { result, state, tr } = run(commands.togglePrompt, initial);
    expect(result).toBe(true);
    expect(tr?.getMeta(PROMPT_PLUGIN_KEY)).toEqual({ pos: 5 });
    expect(PROMPT_PLUGIN_KEY.getState(state)).toBe(5);
  });

  test("closes an open prompt and refocuses the editor", () => {
    const initial = createState(doc(p("Hello")), 3, [promptState()]);
    const opened = run(commands.togglePrompt, initial).state;
    withView(opened, (view) => {
      const focus = vi.spyOn(view, "focus").mockImplementation(() => {});
      expect(commands.togglePrompt(view.state, view.dispatch, view)).toBe(true);
      expect(PROMPT_PLUGIN_KEY.getState(view.state)).toBeNull();
      expect(focus).toHaveBeenCalledTimes(1);
    });
  });

  test("works without the prompt plugin or a view", () => {
    const { tr } = run(commands.togglePrompt, createState(doc(p("Hello")), 3));
    expect(tr?.getMeta(PROMPT_PLUGIN_KEY)).toEqual({ pos: 3 });
  });

  test("returns true without dispatching", () => {
    expect(commands.togglePrompt(createState(doc(p("Hello")), 3))).toBe(true);
  });
});

describe("openMentionPicker", () => {
  test("opens the picker at the start of the selection", () => {
    const initial = createState(doc(p("Hello")), "ell", [mentions()]);
    const { result, state, tr } = run(commands.openMentionPicker, initial);
    expect(result).toBe(true);
    expect(tr?.getMeta(MENTION_PLUGIN_KEY)).toEqual({ pos: 2 });
    const decorations = MENTION_PLUGIN_KEY.getState(state)?.find() ?? [];
    expect(decorations).toHaveLength(1);
    expect(decorations[0]?.from).toBe(2);
  });

  test("returns true without dispatching", () => {
    expect(commands.openMentionPicker(createState(doc(p("Hello")), 3))).toBe(true);
  });
});
