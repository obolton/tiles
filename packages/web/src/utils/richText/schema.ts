import { Schema } from "prosemirror-model";
import type {
  AttributeSpec,
  NodeSpec,
  MarkSpec,
  DOMOutputSpec,
} from "prosemirror-model";

const DOMOutput = {
  paragraph: ["p", 0],
  quote: ["blockquote", 0],
  h1: ["h1", 0],
  h2: ["h2", 0],
  h3: ["h3", 0],
  orderedList: ["ol", 0],
  unorderedList: ["ul", 0],
  checkList: ["ul", { class: "checklist" }, 0],
  li: ["li", 0],
  liChecked: ["li", { role: "checkbox", "aria-checked": "true" }, 0],
  liUnchecked: ["li", { role: "checkbox", "aria-checked": "false" }, 0],
  bold: ["strong", 0],
  italic: ["em", 0],
  underline: ["span", { class: "underline" }, 0],
  strikethrough: ["del", 0],
  highlight: ["mark", 0],
} as const satisfies Record<string, DOMOutputSpec>;

export type TextAlignment = "left" | "center" | "right";

function getTextAttributes(element: HTMLElement): { align: TextAlignment } {
  const align = element.style.textAlign;
  switch (align) {
    case "left":
    case "center":
    case "right":
      return { align };
    default:
      return { align: "left" };
  }
}

const attributesSpec = {
  align: {
    default: "left",
    validate(value) {
      if (!(value === "left" || value === "center" || value === "right")) {
        throw new RangeError(`Invalid paragraph alignment: ${value}`);
      }
    },
  },
} as const satisfies Record<string, AttributeSpec>;

const nodesSpec = {
  doc: {
    content: "block+",
  },

  text: {
    group: "inline",
  },

  paragraph: {
    attrs: {
      align: attributesSpec.align,
    },
    content: "inline*",
    group: "block",
    parseDOM: [
      {
        tag: "p",
        getAttrs: getTextAttributes,
      },
    ],
    toDOM(node) {
      return ["p", { class: node.attrs.align }, 0];
    },
  },

  quote: {
    content:
      "(paragraph | heading | ordered_list | unordered_list | check_list)+",
    group: "block",
    defining: true,
    parseDOM: [{ tag: "blockquote" }],
    toDOM() {
      return DOMOutput.quote;
    },
  },

  heading: {
    attrs: {
      level: {
        default: 1,
        validate(value) {
          if (!(value === 1 || value === 2 || value === 3)) {
            throw new RangeError("Invalid heading level");
          }
        },
      },
      align: attributesSpec.align,
    },
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [
      {
        tag: "h1",
        getAttrs: (element) => ({ ...getTextAttributes(element), level: 1 }),
      },
      {
        tag: "h2",
        getAttrs: (element) => ({ ...getTextAttributes(element), level: 2 }),
      },
      {
        tag: "h3",
        getAttrs: (element) => ({ ...getTextAttributes(element), level: 3 }),
      },
    ],
    toDOM(node) {
      return ["h" + node.attrs.level, { class: node.attrs.align }, 0];
    },
  },

  ordered_list: {
    attrs: { order: { default: 1, validate: "number" } },
    content: "list_item+",
    group: "block",
    parseDOM: [
      {
        tag: "ol",
        getAttrs(element) {
          return { order: (element as HTMLOListElement).start || 1 };
        },
      },
    ],
    toDOM(node) {
      return node.attrs.order === 1
        ? DOMOutput.orderedList
        : ["ol", { start: node.attrs.order }, 0];
    },
  },

  unordered_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ul:not(.checklist)" }],
    toDOM() {
      return DOMOutput.unorderedList;
    },
  },

  list_item: {
    attrs: {
      checked: { default: false, validate: "boolean" },
    },
    content: "(paragraph | heading) block*",
    defining: true,
    parseDOM: [
      {
        tag: "li",
        getAttrs(element) {
          if (element.role === "checkbox") {
            return { checked: element.ariaChecked === "true" };
          } else {
            return { checked: undefined };
          }
        },
      },
    ],
    toDOM(node) {
      switch (node.attrs.checked) {
        case true:
          return DOMOutput.liChecked;
        case false:
          return DOMOutput.liUnchecked;
        default:
          return DOMOutput.li;
      }
    },
  },

  check_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ul.checklist" }],
    toDOM() {
      return DOMOutput.checkList;
    },
  },
} as const satisfies Record<string, NodeSpec>;

type KeysWithProperty<T, Key, Value> = {
  [K in keyof T]: Key extends keyof T[K]
    ? T[K][Key] extends Value
      ? K
      : never
    : never;
}[keyof T];

export type BlockNode = KeysWithProperty<typeof nodesSpec, "group", "block">;

const marksSpec = {
  link: {
    attrs: {
      href: { validate: "string" },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(node) {
          return { href: node.getAttribute("href") };
        },
      },
    ],
    toDOM(mark) {
      return ["a", { href: mark.attrs.href }, 0];
    },
  },

  bold: {
    parseDOM: [{ tag: "strong" }, { tag: "b" }],
    toDOM() {
      return DOMOutput.bold;
    },
  },

  italic: {
    parseDOM: [{ tag: "em" }, { tag: "i" }, { style: "font-style=italic" }],
    toDOM() {
      return DOMOutput.italic;
    },
  },

  underline: {
    parseDOM: [
      { tag: "u" },
      { tag: ".underline" },
      { style: "text-decoration=underline" },
    ],
    toDOM() {
      return DOMOutput.underline;
    },
  },

  strikethrough: {
    parseDOM: [{ tag: "del" }, { style: "text-decoration=line-through" }],
    toDOM() {
      return DOMOutput.strikethrough;
    },
  },

  highlight: {
    parseDOM: [{ tag: "mark" }],
    toDOM() {
      return DOMOutput.highlight;
    },
  },
} as const satisfies Record<string, MarkSpec>;

export const schema = new Schema<
  keyof typeof nodesSpec,
  keyof typeof marksSpec
>({
  nodes: nodesSpec,
  marks: marksSpec,
});

const headerNodesSpec = {
  doc: {
    content: "heading paragraph?",
  },

  text: {
    group: "inline",
  },

  heading: {
    content: "inline*",
    defining: true,
    parseDOM: [{ tag: "h1" }],
    toDOM() {
      return DOMOutput.h1;
    },
  },

  paragraph: {
    content: "inline*",
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return DOMOutput.paragraph;
    },
  },
};

export const headerSchema = new Schema<keyof typeof headerNodesSpec>({
  nodes: headerNodesSpec,
});
