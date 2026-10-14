import { describe, expect, test } from "vitest";
import { NodeSelection } from "prosemirror-state";
import { schema } from "../schema";
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
import {
  bold,
  checkList,
  code,
  codeBlock,
  createState,
  divider,
  doc,
  h,
  italic,
  li,
  link,
  mention,
  ol,
  p,
  quote,
  range,
  text,
  ul,
} from "./builders";

const onDivider = () => {
  const only = doc(divider());
  return createState(only, NodeSelection.create(only, 0));
};

describe("closest", () => {
  test("returns the nearest ancestor matching the predicate", () => {
    const nested = doc(quote(ul(li(p("Item")))));
    const state = createState(nested, "Item");
    const list = closest(
      state.selection.$from,
      (node) => node.type === schema.nodes.unordered_list,
    );
    expect(list?.node.type).toBe(schema.nodes.unordered_list);
    expect(list?.pos).toBe(1);
    expect(list?.depth).toBe(2);
  });

  test("prefers the innermost match", () => {
    const nested = doc(ol(li([p("Parent"), ul(li(p("Child")))])));
    const state = createState(nested, "Child");
    const list = closest(state.selection.$from, (node) => node.type.spec.group === "block");
    expect(list?.node.type).toBe(schema.nodes.paragraph);
  });

  test("ignores the document node and returns null without a match", () => {
    const state = createState(doc(p("Text")), 2);
    expect(closest(state.selection.$from, (node) => node.type === schema.nodes.doc)).toBeNull();
    expect(closest(state.selection.$from, (node) => node.type === schema.nodes.quote)).toBeNull();
  });
});

describe("findInSelection", () => {
  test("collects the nodes touching the selection that match", () => {
    const state = createState(doc(p("One"), h(1, "Two"), p("Three")), [2, 7]);
    const nodes = findInSelection(state, (node) => node.isTextblock);
    expect(nodes.map((node) => node.textContent)).toEqual(["One", "Two"]);
  });

  test("returns an empty list without matches", () => {
    const state = createState(doc(p("One")), 2);
    expect(findInSelection(state, (node) => node.type === schema.nodes.divider)).toEqual([]);
  });
});

describe("getSelectionMarks", () => {
  test("returns the stored marks for a collapsed selection", () => {
    const initial = createState(doc(p("Text")), 2);
    const state = initial.apply(initial.tr.setStoredMarks([italic]));
    expect(getSelectionMarks(state)).toEqual([italic]);
  });

  test("returns the marks at the cursor without stored marks", () => {
    const state = createState(doc(p(["plain ", text("bold", bold)])), 9);
    expect(getSelectionMarks(state)).toEqual([bold]);
  });

  test("returns the marks shared by every text node in the selection", () => {
    const content = p([text("one ", bold, italic), text("two", bold), text(" three", bold, code)]);
    const state = createState(doc(content), [1, 14]);
    expect(getSelectionMarks(state)).toEqual([bold]);
  });

  test("returns no marks when a text node has none of them", () => {
    const state = createState(doc(p([text("one ", bold), "two"])), [1, 8]);
    expect(getSelectionMarks(state)).toEqual([]);
  });

  test("returns no marks when the selection has no text", () => {
    const content = doc(p(mention("user-1", "Ada")));
    const state = createState(content, NodeSelection.create(content, 1));
    expect(getSelectionMarks(state)).toEqual([]);
  });
});

describe("getSelectionBlockNodeTypes", () => {
  test("collects every block type in the selection", () => {
    const state = createState(doc(quote(p("One")), ul(li(p("Two")))), [3, 10]);
    expect(getSelectionBlockNodeTypes(state)).toEqual(
      new Set([
        schema.nodes.quote,
        schema.nodes.paragraph,
        schema.nodes.unordered_list,
        schema.nodes.list_item,
      ]),
    );
  });
});

describe("getSelectionHeadingLevel", () => {
  test("returns the level shared by every heading in the selection", () => {
    expect(getSelectionHeadingLevel(createState(doc(h(2, "One"), h(2, "Two")), [2, 7]))).toBe(2);
  });

  test("returns null for mixed levels", () => {
    expect(getSelectionHeadingLevel(createState(doc(h(1, "One"), h(2, "Two")), [2, 7]))).toBeNull();
  });

  test("returns null when a paragraph is selected", () => {
    expect(getSelectionHeadingLevel(createState(doc(p("One")), 2))).toBeNull();
    expect(getSelectionHeadingLevel(createState(doc(h(1, "One"), p("Two")), [2, 7]))).toBeNull();
  });

  test("returns null without text blocks", () => {
    expect(getSelectionHeadingLevel(onDivider())).toBeNull();
  });
});

describe("findMark", () => {
  test("finds a mark of the given type on a node", () => {
    const node = text("x", bold, italic);
    expect(findMark(node, schema.marks.italic)).toBe(italic);
    expect(findMark(node, schema.marks.code)).toBeUndefined();
  });
});

describe("getLink", () => {
  const linked = doc(p(["See ", link("https://example.com", "docs")]));

  test("returns the link around the cursor", () => {
    const resolved = getLink(createState(linked, "oc"));
    expect(resolved?.node.attrs.href).toBe("https://example.com");
    expect(resolved?.pos).toBe(5);
  });

  test("returns null outside a link", () => {
    expect(getLink(createState(linked, "See"))).toBeNull();
  });
});

describe("getCodeBlockAttrs", () => {
  test("returns the attributes of the enclosing code block", () => {
    const state = createState(doc(codeBlock("ls", { language: "sh", lineNumbers: true })), 2);
    expect(getCodeBlockAttrs(state)).toEqual({ language: "sh", lineNumbers: true });
  });

  test("returns null outside a code block", () => {
    expect(getCodeBlockAttrs(createState(doc(p("Text")), 2))).toBeNull();
  });
});

describe("text block attribute getters", () => {
  const styled = doc(p("Text", { align: "center", lineHeight: 1.5, indent: 2 }), p("Plain"));

  test("read the attributes of the text block at the selection start", () => {
    const state = createState(styled, [2, 8]);
    expect(getSelectionAlignment(state)).toBe("center");
    expect(getSelectionLineHeight(state)).toBe(1.5);
    expect(getSelectionIndent(state)).toBe(2);
  });

  test("return the defaults of an unstyled block", () => {
    const state = createState(styled, "Plain");
    expect(getSelectionAlignment(state)).toBe("left");
    expect(getSelectionLineHeight(state)).toBeUndefined();
    expect(getSelectionIndent(state)).toBeUndefined();
  });

  test("return undefined outside a text block", () => {
    const state = onDivider();
    expect(getSelectionAlignment(state)).toBeUndefined();
    expect(getSelectionLineHeight(state)).toBeUndefined();
    expect(getSelectionIndent(state)).toBeUndefined();
  });
});

describe("isInList", () => {
  test.each([
    ["ordered", ol],
    ["unordered", ul],
    ["check", checkList],
  ])("is true inside a %s list", (_, list) => {
    expect(isInList(createState(doc(list(li(p("Item")))), 3))).toBe(true);
  });

  test("is false outside a list", () => {
    expect(isInList(createState(doc(p("Item")), 2))).toBe(false);
    expect(isInList(onDivider())).toBe(false);
  });
});

describe("getSelectionList", () => {
  test.each([
    ["unordered", ul],
    ["ordered", ol],
    ["check", checkList],
  ] as const)("returns %s for a selection in that list", (expected, list) => {
    expect(getSelectionList(createState(doc(list(li(p("Item")))), 3))).toBe(expected);
  });

  test("returns null outside a list", () => {
    expect(getSelectionList(createState(doc(p("Item")), 2))).toBeNull();
  });

  test("prefers unordered, then ordered, then check lists across a selection", () => {
    const mixed = doc(checkList(li(p("One"))), ol(li(p("Two"))), ul(li(p("Three"))));
    expect(getSelectionList(createState(mixed, "One"))).toBe("check");
    expect(
      getSelectionList(createState(mixed, [range(mixed, "One")[0], range(mixed, "Two")[1]])),
    ).toBe("ordered");
    expect(
      getSelectionList(createState(mixed, [range(mixed, "One")[0], range(mixed, "Three")[1]])),
    ).toBe("unordered");
  });
});

describe("getMarkRange", () => {
  test("returns the range of the mark around a position", () => {
    const content = doc(p(["ab", text("cd", bold), "ef"]));
    expect(getMarkRange(createState(content), 4, schema.marks.bold)).toEqual({ from: 3, to: 5 });
  });

  test("spans adjacent text nodes that carry the mark", () => {
    const content = doc(p(["ab", text("cd", bold, italic), text("ef", bold), "gh"]));
    expect(getMarkRange(createState(content), 5, schema.marks.bold)).toEqual({ from: 3, to: 7 });
  });

  test("skips over inline nodes inside the marked run", () => {
    const content = doc(
      p(["ab", text("cd", bold), mention("user-1", "Ada"), text("ef", bold), "gh"]),
    );
    expect(getMarkRange(createState(content), 7, schema.marks.bold)).toEqual({ from: 3, to: 8 });
  });

  test("returns null when the position carries no such mark", () => {
    const content = doc(p(["ab", text("cd", bold), "ef"]));
    expect(getMarkRange(createState(content), 2, schema.marks.bold)).toBeNull();
    expect(getMarkRange(createState(content), 4, schema.marks.italic)).toBeNull();
  });
});

describe("getListDepth", () => {
  test("is -1 outside a list", () => {
    expect(getListDepth(createState(doc(p("Text")), 2).selection.$from)).toBe(-1);
  });

  test("counts the enclosing lists", () => {
    const nested = doc(ol(li([p("Parent"), ul(li([p("Child"), checkList(li(p("Grandchild")))]))])));
    expect(getListDepth(createState(nested, "Parent").selection.$from)).toBe(0);
    expect(getListDepth(createState(nested, "Child").selection.$from)).toBe(1);
    expect(getListDepth(createState(nested, "Grandchild").selection.$from)).toBe(2);
  });
});
