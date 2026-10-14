import { describe, expect, test, vi } from "vitest";
import { GapCursor } from "prosemirror-gapcursor";
import { Plugin } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import { MAX_INDENT } from "@/constants/formatting";
import { COLOR, FONT } from "@/test/fixtures/richText";
import {
  cl,
  codeBlock,
  createEditorState,
  createView,
  cursorAfter,
  cursorBefore,
  date,
  divider,
  doc,
  dropdown,
  h1,
  h2,
  h3,
  li,
  link,
  mark,
  mention,
  ol,
  p,
  pendingBlock,
  quote,
  runCommand,
  selectNode,
  selectText,
  text,
  ul,
} from "@/test/helpers/richText";
import {
  addLink,
  addMark,
  adjustIndent,
  approve,
  deleteNode,
  indent,
  insertDateTime,
  insertDivider,
  insertDropdown,
  insertMention,
  openMentionPicker,
  outdent,
  reject,
  removeLink,
  removeMark,
  removeTextColor,
  resetBlockFormat,
  setAlignment,
  setCodeBlockLanguage,
  setFont,
  setLineHeight,
  setTextColor,
  setTextSize,
  toggleBold,
  toggleCheckList,
  toggleCode,
  toggleCodeBlockLineNumbers,
  toggleHeading,
  toggleHighlight,
  toggleInlineCode,
  toggleItalic,
  toggleList,
  toggleOrderedList,
  togglePrompt,
  toggleQuote,
  toggleSmallCaps,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  toggleUnderline,
  toggleUnorderedList,
  toggleWrap,
  unwrap,
} from "../commands";
import { MENTION_PLUGIN_KEY } from "../mentions";
import { PROMPT_PLUGIN_KEY } from "../pluginKeys";
import { schema } from "../schema";

const bold = mark("bold");
const italic = mark("italic");
const HREF = "https://example.com";

function isDivider(node: { type: { name: string } }) {
  return node.type.name === "divider";
}

// An empty selection between two blocks, outside any text block.
function gapCursorBetweenBlocks() {
  const content = doc(p("One"), divider());
  return createEditorState(content, new GapCursor(content.resolve(5)));
}

describe("addMark", () => {
  test("stores the mark on a collapsed selection without changing the document", () => {
    const content = doc(p("Hello"));
    const { state } = runCommand(
      addMark(bold),
      createEditorState(content, cursorAfter(content, "Hello")),
    );

    expect(state.storedMarks).toEqual([bold]);
    expect(state.doc.eq(content)).toBe(true);
  });

  test("applies the mark to the selected range", () => {
    const content = doc(p("Hello"));
    const { handled, doc: result } = runCommand(
      addMark(bold),
      createEditorState(content, selectText(content, "ell")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("H", text("ell", bold), "o")).toJSON());
  });

  test("reports itself as applicable without dispatching", () => {
    const content = doc(p("Hello"));
    expect(addMark(bold)(createEditorState(content, selectText(content, "ell")))).toBe(true);
  });
});

describe("removeMark", () => {
  test("clears a stored mark", () => {
    const content = doc(p("Hello"));
    const initial = createEditorState(content, cursorAfter(content, "Hello"));
    const withStored = initial.apply(initial.tr.addStoredMark(bold).addStoredMark(italic));

    const { state } = runCommand(removeMark(bold), withStored);

    expect(state.storedMarks).toEqual([italic]);
  });

  test("removes the mark from the selected range", () => {
    const content = doc(p(text("Hello", bold)));
    const { doc: result } = runCommand(
      removeMark(bold),
      createEditorState(content, selectText(content, "ell")),
    );

    expect(result.toJSON()).toEqual(doc(p(text("H", bold), "ell", text("o", bold))).toJSON());
  });

  test("accepts a mark type", () => {
    const content = doc(p(text("Hello", bold, italic)));
    const { doc: result } = runCommand(
      removeMark(schema.marks.bold),
      createEditorState(content, selectText(content, "Hello")),
    );

    expect(result.toJSON()).toEqual(doc(p(text("Hello", italic))).toJSON());
  });
});

describe("text style commands", () => {
  test("setTextSize applies a size mark", () => {
    const content = doc(p("Hello"));
    const { doc: result } = runCommand(
      setTextSize(1.5),
      createEditorState(content, selectText(content, "Hello")),
    );

    expect(result.firstChild?.firstChild?.marks).toEqual([mark("size", { size: 1.5 })]);
  });

  test("setTextColor and removeTextColor toggle the color mark", () => {
    const content = doc(p("Hello"));
    const colored = runCommand(
      setTextColor(COLOR),
      createEditorState(content, selectText(content, "Hello")),
    );
    expect(colored.doc.firstChild?.firstChild?.marks).toEqual([mark("color", { color: COLOR })]);

    const cleared = runCommand(removeTextColor, colored.state);
    expect(cleared.doc.firstChild?.firstChild?.marks).toEqual([]);
  });

  test("setFont applies a font mark", () => {
    const content = doc(p("Hello"));
    const { doc: result } = runCommand(
      setFont(FONT),
      createEditorState(content, selectText(content, "Hello")),
    );

    expect(result.firstChild?.firstChild?.marks).toEqual([mark("font", { font: FONT })]);
  });
});

describe("mark toggles", () => {
  test.each([
    ["toggleBold", toggleBold, "bold"],
    ["toggleItalic", toggleItalic, "italic"],
    ["toggleUnderline", toggleUnderline, "underline"],
    ["toggleStrikethrough", toggleStrikethrough, "strikethrough"],
    ["toggleHighlight", toggleHighlight, "highlight"],
    ["toggleSuperscript", toggleSuperscript, "superscript"],
    ["toggleSubscript", toggleSubscript, "subscript"],
    ["toggleSmallCaps", toggleSmallCaps, "smallCaps"],
    ["toggleInlineCode", toggleInlineCode, "code"],
  ] as const)("%s adds and then removes the mark", (_name, command, markName) => {
    const content = doc(p("Hello"));
    const markType = schema.marks[markName];

    const added = runCommand(command, createEditorState(content, selectText(content, "ell")));
    expect(added.doc.toJSON()).toEqual(doc(p("H", text("ell", markType.create()), "o")).toJSON());

    const removed = runCommand(command, added.state);
    expect(removed.doc.eq(content)).toBe(true);
  });
});

describe("addLink", () => {
  test("returns false for an empty href", () => {
    const content = doc(p("Visit site"));
    expect(addLink("")(createEditorState(content, selectText(content, "site")))).toBe(false);
  });

  test("returns false for a collapsed selection", () => {
    const content = doc(p("Visit site"));
    expect(addLink(HREF)(createEditorState(content, cursorAfter(content, "site")))).toBe(false);
  });

  test("wraps the selection in a link, keeping its marks", () => {
    const content = doc(p("Visit ", text("site", bold), " now"));
    const { handled, doc: result } = runCommand(
      addLink(HREF),
      createEditorState(content, selectText(content, "site")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(
      doc(p("Visit ", link({ href: HREF }, text("site", bold)), " now")).toJSON(),
    );
  });
});

describe("removeLink", () => {
  test("unwraps the link around the cursor", () => {
    const content = doc(p("Visit ", link({ href: HREF }, "here"), " now"));
    const { handled, doc: result } = runCommand(
      removeLink,
      createEditorState(content, cursorAfter(content, "he")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("Visit here now")).toJSON());
  });

  test("returns false outside a link", () => {
    const content = doc(p("Visit site"));
    expect(removeLink(createEditorState(content, cursorAfter(content, "site")))).toBe(false);
  });
});

describe("toggleQuote", () => {
  test("wraps the selected blocks in a quote", () => {
    const content = doc(p("One"), p("Two"), p("Three"));
    const { doc: result } = runCommand(
      toggleQuote,
      createEditorState(content, selectText(content, "One", "Two")),
    );

    expect(result.toJSON()).toEqual(doc(quote(p("One"), p("Two")), p("Three")).toJSON());
  });

  test("lifts the selection out of an existing quote", () => {
    const content = doc(quote(p("One")));
    const { doc: result } = runCommand(
      toggleQuote,
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(result.toJSON()).toEqual(doc(p("One")).toJSON());
  });

  test("toggleWrap works with other wrapping node types", () => {
    const content = doc(p("Draft"));
    const { doc: result } = runCommand(
      toggleWrap(schema.nodes.pending),
      createEditorState(content, cursorAfter(content, "Draft")),
    );

    expect(result.toJSON()).toEqual(doc(pendingBlock(p("Draft"))).toJSON());
  });
});

describe("toggleCode", () => {
  test("converts the selected blocks to code blocks and drops marks", () => {
    const content = doc(p(text("one", bold)), h1("two"), p("three"));
    const { handled, doc: result } = runCommand(
      toggleCode,
      createEditorState(content, selectText(content, "one", "two")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(codeBlock("one"), codeBlock("two"), p("three")).toJSON());
  });

  test("is applicable without dispatching", () => {
    const content = doc(p("one"));
    expect(toggleCode(createEditorState(content, cursorAfter(content, "one")))).toBe(true);
  });
});

describe("toggleHeading", () => {
  test("converts a paragraph to a heading, keeping align and indent", () => {
    const content = doc(p({ align: "center", indent: 2 }, "Title"));
    const { handled, doc: result } = runCommand(
      toggleHeading(2),
      createEditorState(content, cursorAfter(content, "Title")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(h2({ align: "center", indent: 2 }, "Title")).toJSON());
  });

  test("converts a heading of the same level back to a paragraph", () => {
    const content = doc(
      h3({ align: "right", lineHeight: 2, indent: 1, theme: "fancy" }, "Title"),
      p("Body"),
    );
    const { doc: result } = runCommand(
      toggleHeading(3),
      createEditorState(content, cursorAfter(content, "Title")),
    );

    expect(result.toJSON()).toEqual(
      doc(p({ align: "right", lineHeight: 2, indent: 1 }, "Title"), p("Body")).toJSON(),
    );
  });

  test("changes the level of a heading at a different level", () => {
    const content = doc(h1({ theme: "fancy" }, "Title"));
    const { doc: result } = runCommand(
      toggleHeading(3),
      createEditorState(content, cursorAfter(content, "Title")),
    );

    expect(result.toJSON()).toEqual(doc(h3({ theme: "fancy" }, "Title")).toJSON());
  });

  test("lifts a list item out of its list before converting it", () => {
    const content = doc(ul(li(p("One")), li(p("Two"))));
    const { doc: result } = runCommand(
      toggleHeading(1),
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(result.toJSON()).toEqual(doc(h1("One"), ul(li(p("Two")))).toJSON());
  });

  test("converts every block in a ranged selection", () => {
    const content = doc(p("One"), p("Two"));
    const { doc: result } = runCommand(
      toggleHeading(2),
      createEditorState(content, selectText(content, "One", "Two")),
    );

    expect(result.toJSON()).toEqual(doc(h2("One"), h2("Two")).toJSON());
  });

  test("requires a view to convert to a heading", () => {
    const content = doc(p("Title"));
    expect(toggleHeading(1)(createEditorState(content, cursorAfter(content, "Title")))).toBe(false);
  });

  test("converting back to a paragraph is applicable without dispatching", () => {
    const content = doc(h1("Title"));
    expect(toggleHeading(1)(createEditorState(content, cursorAfter(content, "Title")))).toBe(true);
  });
});

describe("resetBlockFormat", () => {
  test("converts headings to paragraphs, keeping align and line height", () => {
    const content = doc(
      h1({ align: "right", lineHeight: 1.5, indent: 1, theme: "fancy" }, "Title"),
      p({ indent: 3 }, "Body"),
    );
    const { handled, doc: result } = runCommand(
      resetBlockFormat,
      createEditorState(content, selectText(content, "Title", "Body")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(
      doc(p({ align: "right", lineHeight: 1.5 }, "Title"), p("Body")).toJSON(),
    );
  });

  test("is applicable without dispatching", () => {
    const content = doc(h1("Title"));
    expect(resetBlockFormat(createEditorState(content, cursorAfter(content, "Title")))).toBe(true);
  });
});

describe("toggleList", () => {
  test.each([
    ["toggleOrderedList", toggleOrderedList, ol],
    ["toggleUnorderedList", toggleUnorderedList, ul],
    ["toggleCheckList", toggleCheckList, cl],
  ] as const)("%s wraps a paragraph in a list", (_name, command, list) => {
    const content = doc(p("Item"));
    const { handled, doc: result } = runCommand(
      command,
      createEditorState(content, cursorAfter(content, "Item")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(list(li(p("Item")))).toJSON());
  });

  test("wraps each selected block as its own list item", () => {
    const content = doc(p("One"), p("Two"), p("Three"));
    const { doc: result } = runCommand(
      toggleOrderedList,
      createEditorState(content, selectText(content, "One", "Two")),
    );

    expect(result.toJSON()).toEqual(doc(ol(li(p("One")), li(p("Two"))), p("Three")).toJSON());
  });

  test("converts a heading to a paragraph before wrapping it", () => {
    const content = doc(h1("Title"));
    const { doc: result } = runCommand(
      toggleUnorderedList,
      createEditorState(content, cursorAfter(content, "Title")),
    );

    expect(result.toJSON()).toEqual(doc(ul(li(p("Title")))).toJSON());
  });

  test("lifts the item out when the selection is already in that list type", () => {
    const content = doc(ol(li(p("One")), li(p("Two"))));
    const { handled, doc: result } = runCommand(
      toggleOrderedList,
      createEditorState(content, cursorAfter(content, "Two")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(ol(li(p("One"))), p("Two")).toJSON());
  });

  test("switches the list type when the selection is in a different list", () => {
    const content = doc(ol({ order: 3 }, li(p("One")), li(p("Two"))));
    const { doc: result } = runCommand(
      toggleCheckList,
      createEditorState(content, cursorAfter(content, "Two")),
    );

    expect(result.toJSON()).toEqual(doc(cl(li(p("One")), li(p("Two")))).toJSON());
  });

  test("switching the list type is applicable without dispatching", () => {
    const content = doc(ul(li(p("One"))));
    expect(toggleCheckList(createEditorState(content, cursorAfter(content, "One")))).toBe(true);
  });

  test("wrapping is applicable without dispatching", () => {
    const content = doc(p("One"));
    expect(
      toggleList(schema.nodes.ordered_list)(
        createEditorState(content, cursorAfter(content, "One")),
      ),
    ).toBe(true);
  });

  test("returns false when the selection cannot be wrapped in a list", () => {
    const content = doc(p("One"), divider());
    const state = createEditorState(content, selectNode(content, isDivider));

    expect(runCommand(toggleOrderedList, state).handled).toBe(false);
    expect(runCommand(toggleOrderedList, state).doc.eq(content)).toBe(true);
  });
});

describe("unwrap and deleteNode", () => {
  test("approve unwraps the pending block around the cursor", () => {
    const content = doc(p("Keep"), pendingBlock(p("Draft"), p("More")));
    const { handled, doc: result } = runCommand(
      approve,
      createEditorState(content, cursorAfter(content, "Draft")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("Keep"), p("Draft"), p("More")).toJSON());
  });

  test("reject deletes the pending block around the cursor", () => {
    const content = doc(p("Keep"), pendingBlock(p("Draft"), p("More")));
    const { handled, doc: result } = runCommand(
      reject,
      createEditorState(content, cursorAfter(content, "More")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("Keep")).toJSON());
  });

  test("both return false outside a pending block", () => {
    const content = doc(p("Keep"));
    const state = createEditorState(content, cursorAfter(content, "Keep"));

    expect(approve(state)).toBe(false);
    expect(reject(state)).toBe(false);
  });

  test("report applicability without dispatching", () => {
    const content = doc(pendingBlock(p("Draft")));
    const state = createEditorState(content, cursorAfter(content, "Draft"));

    expect(unwrap(schema.nodes.pending)(state)).toBe(true);
    expect(deleteNode(schema.nodes.pending)(state)).toBe(true);
  });
});

describe("setLineHeight", () => {
  test("sets the line height of the block around a collapsed selection", () => {
    const content = doc(p("One"), p("Two"));
    const { handled, doc: result } = runCommand(
      setLineHeight(2),
      createEditorState(content, cursorAfter(content, "Two")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("One"), p({ lineHeight: 2 }, "Two")).toJSON());
  });

  test("sets the line height of every text block in a ranged selection", () => {
    const content = doc(p("One"), ul(li(p("Two"))), h1("Three"), p("Four"));
    const { doc: result } = runCommand(
      setLineHeight(1.5),
      createEditorState(content, selectText(content, "One", "Three")),
    );

    expect(result.toJSON()).toEqual(
      doc(
        p({ lineHeight: 1.5 }, "One"),
        ul(li(p({ lineHeight: 1.5 }, "Two"))),
        h1({ lineHeight: 1.5 }, "Three"),
        p("Four"),
      ).toJSON(),
    );
  });

  test("clears the line height with undefined", () => {
    const content = doc(p({ lineHeight: 2 }, "One"));
    const { doc: result } = runCommand(
      setLineHeight(undefined),
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(result.toJSON()).toEqual(doc(p("One")).toJSON());
  });

  test("returns false when no text block surrounds the cursor", () => {
    expect(setLineHeight(2)(gapCursorBetweenBlocks())).toBe(false);
  });

  test("is applicable without dispatching", () => {
    const content = doc(p("One"), p("Two"));
    expect(setLineHeight(2)(createEditorState(content, cursorAfter(content, "One")))).toBe(true);
    expect(setLineHeight(2)(createEditorState(content, selectText(content, "One", "Two")))).toBe(
      true,
    );
  });
});

describe("setAlignment", () => {
  test("aligns the block around a collapsed selection", () => {
    const content = doc(p("One"), p("Two"));
    const { handled, doc: result } = runCommand(
      setAlignment("center"),
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p({ align: "center" }, "One"), p("Two")).toJSON());
  });

  test("aligns every text block in a ranged selection", () => {
    const content = doc(p("One"), h2("Two"), p("Three"));
    const { doc: result } = runCommand(
      setAlignment("right"),
      createEditorState(content, selectText(content, "One", "Two")),
    );

    expect(result.toJSON()).toEqual(
      doc(p({ align: "right" }, "One"), h2({ align: "right" }, "Two"), p("Three")).toJSON(),
    );
  });

  test("returns false when no text block surrounds the cursor", () => {
    expect(setAlignment("center")(gapCursorBetweenBlocks())).toBe(false);
  });

  test("is applicable without dispatching", () => {
    const content = doc(p("One"), p("Two"));
    expect(setAlignment("center")(createEditorState(content, cursorAfter(content, "One")))).toBe(
      true,
    );
    expect(
      setAlignment("center")(createEditorState(content, selectText(content, "One", "Two"))),
    ).toBe(true);
  });
});

describe("adjustIndent", () => {
  test("indent adds one level and outdent removes it", () => {
    const content = doc(p("One"));
    const state = createEditorState(content, cursorAfter(content, "One"));

    const indented = runCommand(indent, state);
    expect(indented.handled).toBe(true);
    expect(indented.doc.toJSON()).toEqual(doc(p({ indent: 1 }, "One")).toJSON());

    const outdented = runCommand(outdent, indented.state);
    expect(outdented.doc.toJSON()).toEqual(doc(p("One")).toJSON());
  });

  test("clamps to MAX_INDENT", () => {
    const content = doc(p({ indent: MAX_INDENT - 1 }, "One"));
    const state = createEditorState(content, cursorAfter(content, "One"));

    const once = runCommand(adjustIndent(5), state);
    expect(once.doc.toJSON()).toEqual(doc(p({ indent: MAX_INDENT }, "One")).toJSON());

    const twice = runCommand(indent, once.state);
    expect(twice.doc.eq(once.doc)).toBe(true);
  });

  test("does not outdent below zero", () => {
    const content = doc(p("One"));
    const { doc: result } = runCommand(
      outdent,
      createEditorState(content, cursorAfter(content, "One")),
    );

    expect(result.eq(content)).toBe(true);
  });

  test("adjusts every text block in a ranged selection", () => {
    const content = doc(p("One"), h1({ indent: 2 }, "Two"), p("Three"));
    const { doc: result } = runCommand(
      indent,
      createEditorState(content, selectText(content, "One", "Two")),
    );

    expect(result.toJSON()).toEqual(
      doc(p({ indent: 1 }, "One"), h1({ indent: 3 }, "Two"), p("Three")).toJSON(),
    );
  });

  test("is applicable without dispatching", () => {
    const content = doc(p("One"));
    expect(indent(createEditorState(content, cursorAfter(content, "One")))).toBe(true);
  });
});

describe("code block attributes", () => {
  test("setCodeBlockLanguage sets the language of the surrounding code block", () => {
    const content = doc(codeBlock("const x = 1;"));
    const { handled, doc: result } = runCommand(
      setCodeBlockLanguage("typescript"),
      createEditorState(content, cursorAfter(content, "const")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(
      doc(codeBlock({ language: "typescript" }, "const x = 1;")).toJSON(),
    );
  });

  test("toggleCodeBlockLineNumbers flips the lineNumbers attribute", () => {
    const content = doc(codeBlock("const x = 1;"));
    const state = createEditorState(content, cursorAfter(content, "const"));

    const on = runCommand(toggleCodeBlockLineNumbers, state);
    expect(on.handled).toBe(true);
    expect(on.doc.firstChild?.attrs.lineNumbers).toBe(true);

    const off = runCommand(toggleCodeBlockLineNumbers, on.state);
    expect(off.doc.firstChild?.attrs.lineNumbers).toBe(false);
  });

  test("both return false outside a code block", () => {
    const content = doc(p("Text"));
    const state = createEditorState(content, cursorAfter(content, "Text"));

    expect(setCodeBlockLanguage("typescript")(state)).toBe(false);
    expect(toggleCodeBlockLineNumbers(state)).toBe(false);
  });

  test("both are applicable without dispatching", () => {
    const content = doc(codeBlock("code"));
    const state = createEditorState(content, cursorAfter(content, "code"));

    expect(setCodeBlockLanguage("typescript")(state)).toBe(true);
    expect(toggleCodeBlockLineNumbers(state)).toBe(true);
  });
});

describe("inline node insertion", () => {
  test("insertDateTime replaces the selection with a date node", () => {
    const value = new Date("2026-10-14T10:30:00.000Z");
    const content = doc(p("Due B today"));
    const { handled, doc: result } = runCommand(
      insertDateTime(value, false),
      createEditorState(content, selectText(content, "B")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(
      doc(p("Due ", date({ value: value.toISOString(), time: false }), " today")).toJSON(),
    );
  });

  test("insertDateTime includes the time by default", () => {
    const value = new Date("2026-10-14T10:30:00.000Z");
    const content = doc(p("Due"));
    const { doc: result } = runCommand(
      insertDateTime(value),
      createEditorState(content, cursorAfter(content, "Due")),
    );

    expect(result.toJSON()).toEqual(doc(p("Due", date({ value: value.toISOString() }))).toJSON());
  });

  test("insertDropdown replaces the selection with a dropdown node", () => {
    const content = doc(p("Status: X"));
    const { doc: result } = runCommand(
      insertDropdown("status", "Done"),
      createEditorState(content, selectText(content, "X")),
    );

    expect(result.toJSON()).toEqual(
      doc(p("Status: ", dropdown({ dropdownType: "status", value: "Done" }))).toJSON(),
    );
  });

  test("insertMention replaces the selection with a mention node", () => {
    const content = doc(p("Ping @"));
    const { doc: result } = runCommand(
      insertMention("user-1", "Ada"),
      createEditorState(content, selectText(content, "@")),
    );

    expect(result.toJSON()).toEqual(
      doc(p("Ping ", mention({ userId: "user-1", displayName: "Ada" }))).toJSON(),
    );
  });

  test("insertDivider splits the paragraph around a divider", () => {
    const content = doc(p("Before|After"));
    const { handled, doc: result } = runCommand(
      insertDivider,
      createEditorState(content, selectText(content, "|")),
    );

    expect(handled).toBe(true);
    expect(result.toJSON()).toEqual(doc(p("Before"), divider(), p("After")).toJSON());
  });

  test("insertion commands are applicable without dispatching", () => {
    const content = doc(p("Text"));
    const state = createEditorState(content, cursorAfter(content, "Text"));

    expect(insertDateTime(new Date())(state)).toBe(true);
    expect(insertDropdown("status", "Done")(state)).toBe(true);
    expect(insertMention("user-1", "Ada")(state)).toBe(true);
    expect(insertDivider(state)).toBe(true);
  });
});

describe("togglePrompt", () => {
  const promptPlugin = new Plugin<DecorationSet | null>({
    key: PROMPT_PLUGIN_KEY,
    state: {
      init: () => DecorationSet.empty,
      apply: (_tr, value) => value,
    },
  });

  test("opens the prompt at the end of the selection", () => {
    const content = doc(p("Hello world"));
    const state = createEditorState(content, selectText(content, "Hello"));
    const { view, transactions } = createView(state);
    const focus = vi.spyOn(view, "focus");

    expect(togglePrompt(view.state, view.dispatch, view)).toBe(true);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.getMeta(PROMPT_PLUGIN_KEY)).toEqual({ pos: state.selection.to });
    expect(focus).not.toHaveBeenCalled();

    view.destroy();
  });

  test("closes an open prompt and refocuses the editor", () => {
    const content = doc(p("Hello world"));
    const state = createEditorState(content, selectText(content, "Hello"), [promptPlugin]);
    const { view, transactions } = createView(state);
    const focus = vi.spyOn(view, "focus");

    togglePrompt(view.state, view.dispatch, view);

    expect(transactions[0]?.getMeta(PROMPT_PLUGIN_KEY)).toEqual({ pos: null });
    expect(focus).toHaveBeenCalledTimes(1);

    view.destroy();
  });

  test("is applicable without dispatching", () => {
    expect(togglePrompt(createEditorState(doc(p("Hello"))))).toBe(true);
  });
});

describe("openMentionPicker", () => {
  test("sets the picker position to the start of the selection", () => {
    const content = doc(p("Hello world"));
    const state = createEditorState(content, selectText(content, "world"));
    const { transactions, handled } = runCommand(openMentionPicker, state);

    expect(handled).toBe(true);
    expect(transactions[0]?.getMeta(MENTION_PLUGIN_KEY)).toEqual({ pos: state.selection.from });
  });

  test("is applicable without dispatching", () => {
    const content = doc(p("Hello"));
    expect(openMentionPicker(createEditorState(content, cursorBefore(content, "Hello")))).toBe(
      true,
    );
  });
});
