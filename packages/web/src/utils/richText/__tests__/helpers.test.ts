import { describe, expect, test } from "vitest";
import { GapCursor } from "prosemirror-gapcursor";
import { COLOR } from "@/test/fixtures/richText";
import {
  cl,
  codeBlock,
  createEditorState,
  cursorAfter,
  date,
  divider,
  doc,
  h1,
  h2,
  li,
  link,
  mark,
  ol,
  p,
  quote,
  selectNode,
  selectText,
  text,
  textRange,
  ul,
} from "@/test/helpers/richText";
import {
  closest,
  findInSelection,
  findMark,
  getCodeBlockAttrs,
  getLink,
  getListDepth,
  getMarkRange,
  getSelectionAlignment,
  getSelectionBlockNodeTypes,
  getSelectionHeadingLevel,
  getSelectionIndent,
  getSelectionLineHeight,
  getSelectionList,
  getSelectionMarks,
  isInList,
} from "../helpers";
import { schema } from "../schema";

const bold = mark("bold");
const italic = mark("italic");
const HREF = "https://example.com";

describe("closest", () => {
  test("returns the nearest ancestor matching the predicate with its position and depth", () => {
    const content = doc(quote(ul(li(p("Item")))));
    const $pos = content.resolve(textRange(content, "Item").from);

    const list = closest($pos, (node) => node.type === schema.nodes.unordered_list);
    expect(list?.node.type).toBe(schema.nodes.unordered_list);
    expect(list?.pos).toBe(1);
    expect(list?.depth).toBe(2);

    const block = closest($pos, (node) => node.isBlock);
    expect(block?.node.type).toBe(schema.nodes.paragraph);
    expect(block?.depth).toBe(4);
  });

  test("returns null when no ancestor matches", () => {
    const content = doc(p("Text"));
    const $pos = content.resolve(textRange(content, "Text").from);

    expect(closest($pos, (node) => node.type === schema.nodes.quote)).toBeNull();
  });

  test("does not match the document itself", () => {
    const content = doc(p("Text"));
    expect(closest(content.resolve(0), () => true)).toBeNull();
  });
});

describe("findInSelection", () => {
  test("collects the nodes in the selection that match the predicate", () => {
    const content = doc(p("One"), h1("Two"), p("Three"));
    const state = createEditorState(content, selectText(content, "One", "Two"));

    const textNodes = findInSelection(state, (node) => node.isText);
    expect(textNodes.map((node) => node.text)).toEqual(["One", "Two"]);
  });
});

describe("getSelectionMarks", () => {
  test("returns the stored marks on a collapsed selection", () => {
    const content = doc(p(text("Bold", bold)));
    const initial = createEditorState(content, cursorAfter(content, "Bold"));
    const state = initial.apply(initial.tr.setStoredMarks([italic]));

    expect(getSelectionMarks(state)).toEqual([italic]);
  });

  test("returns the marks at the cursor when there are no stored marks", () => {
    const content = doc(p(text("Bold", bold), " plain"));
    const state = createEditorState(content, cursorAfter(content, "Bold"));

    expect(getSelectionMarks(state)).toEqual([bold]);
  });

  test("returns the marks shared by every text node in the selection", () => {
    const content = doc(p(text("One ", bold, italic), text("Two", bold)));
    const state = createEditorState(content, selectText(content, "One", "Two"));

    expect(getSelectionMarks(state)).toEqual([bold]);
  });

  test("returns an empty array when nothing is shared", () => {
    const content = doc(p(text("One ", bold), "Two", text("Three", bold)));
    const state = createEditorState(content, selectText(content, "One", "Three"));

    expect(getSelectionMarks(state)).toEqual([]);
  });

  test("returns an empty array when the selection has no text", () => {
    const content = doc(p("One"), divider());
    const state = createEditorState(
      content,
      selectNode(content, (node) => node.type === schema.nodes.divider),
    );

    expect(getSelectionMarks(state)).toEqual([]);
  });
});

describe("getSelectionBlockNodeTypes", () => {
  test("returns the set of block node types in the selection", () => {
    const content = doc(p("One"), quote(h2("Two")), p("Three"));
    const state = createEditorState(content, selectText(content, "One", "Two"));

    expect(getSelectionBlockNodeTypes(state)).toEqual(
      new Set([schema.nodes.paragraph, schema.nodes.quote, schema.nodes.heading]),
    );
  });
});

describe("getSelectionHeadingLevel", () => {
  test("returns the level shared by every heading in the selection", () => {
    const content = doc(h2("One"), h2("Two"));
    const state = createEditorState(content, selectText(content, "One", "Two"));

    expect(getSelectionHeadingLevel(state)).toBe(2);
  });

  test("returns null for mixed levels", () => {
    const content = doc(h1("One"), h2("Two"));
    const state = createEditorState(content, selectText(content, "One", "Two"));

    expect(getSelectionHeadingLevel(state)).toBeNull();
  });

  test("returns null when the selection includes a paragraph", () => {
    const content = doc(h1("One"), p("Two"));

    expect(
      getSelectionHeadingLevel(createEditorState(content, selectText(content, "One", "Two"))),
    ).toBeNull();
    expect(
      getSelectionHeadingLevel(createEditorState(content, cursorAfter(content, "Two"))),
    ).toBeNull();
  });
});

describe("findMark and getLink", () => {
  test("findMark returns the mark of the given type on a node", () => {
    const node = text("Styled", bold, mark("color", { color: COLOR }));

    expect(findMark(node, schema.marks.color)?.attrs.color).toBe(COLOR);
    expect(findMark(node, schema.marks.italic)).toBeUndefined();
  });

  test("getLink returns the link around the cursor", () => {
    const content = doc(p("Visit ", link({ href: HREF }, "here"), " now"));

    const inside = getLink(createEditorState(content, cursorAfter(content, "he")));
    expect(inside?.node.attrs.href).toBe(HREF);
    expect(inside?.pos).toBe(textRange(content, "here").from - 1);

    expect(getLink(createEditorState(content, cursorAfter(content, "now")))).toBeNull();
  });
});

describe("getCodeBlockAttrs", () => {
  test("returns the attributes of the surrounding code block", () => {
    const content = doc(codeBlock({ language: "typescript", lineNumbers: true }, "code"));
    const state = createEditorState(content, cursorAfter(content, "code"));

    expect(getCodeBlockAttrs(state)).toEqual({ language: "typescript", lineNumbers: true });
  });

  test("returns null outside a code block", () => {
    const content = doc(p("Text"));
    expect(getCodeBlockAttrs(createEditorState(content, cursorAfter(content, "Text")))).toBeNull();
  });
});

describe("text block attribute getters", () => {
  const content = doc(
    p({ align: "center", lineHeight: 2, indent: 3 }, "Styled"),
    p("Plain"),
    divider(),
  );

  test("return the attributes of the text block around the cursor", () => {
    const state = createEditorState(content, cursorAfter(content, "Styled"));

    expect(getSelectionAlignment(state)).toBe("center");
    expect(getSelectionLineHeight(state)).toBe(2);
    expect(getSelectionIndent(state)).toBe(3);
  });

  test("return the defaults for an unstyled block", () => {
    const state = createEditorState(content, cursorAfter(content, "Plain"));

    expect(getSelectionAlignment(state)).toBe("left");
    expect(getSelectionLineHeight(state)).toBeUndefined();
    expect(getSelectionIndent(state)).toBeUndefined();
  });

  test("return undefined outside a text block", () => {
    const state = createEditorState(
      content,
      new GapCursor(content.resolve(content.content.size - 1)),
    );

    expect(getSelectionAlignment(state)).toBeUndefined();
    expect(getSelectionLineHeight(state)).toBeUndefined();
    expect(getSelectionIndent(state)).toBeUndefined();
  });
});

describe("isInList and getSelectionList", () => {
  test.each([
    ["ordered", ol],
    ["unordered", ul],
    ["check", cl],
  ] as const)("detect a %s list", (listType, list) => {
    const content = doc(list(li(p("Item"))));
    const state = createEditorState(content, cursorAfter(content, "Item"));

    expect(isInList(state)).toBe(true);
    expect(getSelectionList(state)).toBe(listType);
  });

  test("report no list outside lists", () => {
    const content = doc(p("Text"));
    const state = createEditorState(content, cursorAfter(content, "Text"));

    expect(isInList(state)).toBe(false);
    expect(getSelectionList(state)).toBeNull();
  });

  test("getSelectionList reports a list anywhere in a ranged selection", () => {
    const content = doc(p("Text"), ol(li(p("Item"))));
    const state = createEditorState(content, selectText(content, "Text", "Item"));

    expect(getSelectionList(state)).toBe("ordered");
  });
});

describe("getMarkRange", () => {
  test("spans adjacent text nodes that share the mark", () => {
    const content = doc(p("a", text("bc", bold), text("de", bold, italic), "f"));
    const state = createEditorState(content);
    const { from } = textRange(content, "bc");

    expect(getMarkRange(state, from + 1, schema.marks.bold)).toEqual({
      from,
      to: textRange(content, "de").to,
    });
  });

  test("steps over inline atoms inside the marked range", () => {
    const content = doc(
      p("x", text("ab", bold), date({ value: "2026-10-14" }), text("cd", bold), "y"),
    );
    const state = createEditorState(content);

    expect(getMarkRange(state, textRange(content, "ab").from, schema.marks.bold)).toEqual({
      from: textRange(content, "ab").from,
      to: textRange(content, "cd").to,
    });
  });

  test("stops at text without the mark", () => {
    const content = doc(p("plain ", text("bold", bold), text(" italic", italic)));
    const state = createEditorState(content);

    expect(getMarkRange(state, textRange(content, "bold").to, schema.marks.bold)).toEqual(
      textRange(content, "bold"),
    );
  });

  test("returns null when the position is not inside the mark", () => {
    const content = doc(p("plain ", text("bold", bold)));
    const state = createEditorState(content);

    expect(getMarkRange(state, textRange(content, "plain").from + 1, schema.marks.bold)).toBeNull();
  });
});

describe("getListDepth", () => {
  test("returns -1 outside a list", () => {
    const content = doc(p("Text"));
    expect(getListDepth(content.resolve(textRange(content, "Text").from))).toBe(-1);
  });

  test("counts the enclosing lists", () => {
    const content = doc(ul(li(p("Outer"), ol(li(p("Inner"))))));

    expect(getListDepth(content.resolve(textRange(content, "Outer").from))).toBe(0);
    expect(getListDepth(content.resolve(textRange(content, "Inner").from))).toBe(1);
  });

  test("ignores non-list ancestors", () => {
    const content = doc(quote(ul(li(p("Item")))));
    expect(getListDepth(content.resolve(textRange(content, "Item").from))).toBe(0);
  });
});
