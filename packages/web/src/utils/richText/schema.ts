import { Schema } from "prosemirror-model";
import {
  MIN_TEXT_SIZE,
  MAX_TEXT_SIZE,
  MIN_LINE_HEIGHT,
  MAX_LINE_HEIGHT,
  MAX_INDENT,
  INDENT_SIZE,
} from "@/constants/formatting";
import { toCSSColor, COLOR_HEX_REGEX } from "@/utils/color";
import { serializeStyles } from "@/jsx/attributes";
import { FONT_IDS, getFontConfig, type FontId } from "api/config/fonts";
import type { AttributeSpec, NodeSpec, MarkSpec, DOMOutputSpec } from "prosemirror-model";

const DOMOutput = {
  paragraph: ["p", 0],
  quote: ["blockquote", 0],
  h1: ["h1", 0],
  h2: ["h2", 0],
  h3: ["h3", 0],
  orderedList: ["ol", 0],
  unorderedList: ["ul", 0],
  checkList: ["ul", { class: "checklist" }, 0],
  bold: ["strong", 0],
  italic: ["em", 0],
  underline: ["span", { class: "underline" }, 0],
  strikethrough: ["del", 0],
  highlight: ["mark", 0],
  pending: ["ins", 0],
  code: ["code", 0],
  codeBlock: ["pre", ["code", 0]],
  superscript: ["sup", 0],
  subscript: ["sub", 0],
  smallCaps: ["span", { class: "small-caps" }, 0],
  divider: ["hr"],
} as const satisfies Record<string, DOMOutputSpec>;

export type TextAlignment = "left" | "center" | "right" | "justify";

function getLineHeight(style: CSSStyleDeclaration): number | undefined {
  const value = parseFloat(style.lineHeight);
  if (Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(Math.max(value, MIN_LINE_HEIGHT), MAX_LINE_HEIGHT);
}

function getIndent(style: CSSStyleDeclaration): number | undefined {
  const paddingLeft = style.paddingLeft;
  if (!paddingLeft) {
    return undefined;
  }
  let value = parseFloat(paddingLeft);
  if (Number.isNaN(value) || value <= 0) {
    return undefined;
  }
  if (paddingLeft.endsWith("px")) {
    value /= 16;
  }
  const level = Math.round(value / INDENT_SIZE);
  return level >= 1 ? Math.min(level, MAX_INDENT) : undefined;
}

function getTextAttributes(element: HTMLElement): {
  align: TextAlignment;
  lineHeight: number | undefined;
  indent: number | undefined;
} {
  const align = element.style.textAlign;
  const lineHeight = getLineHeight(element.style);
  const indent = getIndent(element.style);

  switch (align) {
    case "left":
    case "center":
    case "right":
    case "justify":
      return { align, lineHeight, indent };
    default:
      return { align: "left", lineHeight, indent };
  }
}

const attributesSpec = {
  align: {
    default: "left",
    validate(value) {
      if (!(value === "left" || value === "center" || value === "right" || value === "justify")) {
        throw new RangeError(`Invalid paragraph alignment: ${value}`);
      }
    },
  },
  lineHeight: {
    default: undefined,
    validate(value) {
      if (
        value !== undefined &&
        (typeof value !== "number" || value < MIN_LINE_HEIGHT || value > MAX_LINE_HEIGHT)
      ) {
        throw new RangeError(`Invalid line height: ${value}`);
      }
    },
  },
  indent: {
    default: undefined,
    validate(value) {
      if (value !== undefined && (typeof value !== "number" || value < 1 || value > MAX_INDENT)) {
        throw new RangeError(`Invalid indent: ${value}`);
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
      lineHeight: attributesSpec.lineHeight,
      indent: attributesSpec.indent,
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
      const lineHeight = node.attrs.lineHeight as number | undefined;
      const indent = node.attrs.indent as number | undefined;
      return [
        "p",
        {
          class: node.attrs.align as TextAlignment | undefined,
          style:
            serializeStyles({
              lineHeight,
              "--indent": indent,
            }) || undefined,
        },
        0,
      ];
    },
  },

  quote: {
    content: "(paragraph | heading | ordered_list | unordered_list | check_list | divider)+",
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
      lineHeight: attributesSpec.lineHeight,
      indent: attributesSpec.indent,
      theme: { default: undefined, validate: "string|undefined" },
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
      const lineHeight = node.attrs.lineHeight as number | undefined;
      const indent = node.attrs.indent as number | undefined;
      return [
        "h" + node.attrs.level,
        {
          class: node.attrs.align as TextAlignment | undefined,
          style:
            serializeStyles({
              lineHeight,
              "--indent": indent,
            }) || undefined,
        },
        0,
      ];
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
        : ["ol", { start: node.attrs.order as number }, 0];
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
      checked: { default: false, validate: "boolean|undefined" },
    },
    content: "paragraph block*",
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
  },

  check_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ul.checklist" }],
    toDOM() {
      return DOMOutput.checkList;
    },
  },

  link: {
    attrs: {
      href: { validate: "string" },
      theme: { default: undefined, validate: "string|undefined" },
    },
    content: "text*",
    group: "inline",
    inline: true,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(node) {
          return { href: node.getAttribute("href") };
        },
      },
    ],
    toDOM(mark) {
      return ["a", { href: mark.attrs.href as string }, 0];
    },
  },

  date: {
    attrs: {
      value: { validate: "string" },
      time: { default: true, validate: "boolean" },
      theme: { default: null, validate: "string|null" },
    },
    inline: true,
    group: "inline",
    parseDOM: [
      {
        tag: "time",
        getAttrs(node) {
          const dateTime = node.getAttribute("datetime") ?? "";
          return {
            value: dateTime,
            time: dateTime.length > 10,
          };
        },
      },
    ],
  },

  pending: {
    content: "block+",
    group: "block",
    toDOM() {
      return DOMOutput.pending;
    },
  },

  codeBlock: {
    attrs: {
      language: { default: "", validate: "string" },
      lineNumbers: { default: false, validate: "boolean" },
    },
    content: "text*",
    group: "block",
    marks: "",
    code: true,
    defining: true,
    parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
    toDOM() {
      return DOMOutput.codeBlock;
    },
  },

  divider: {
    group: "block",
    atom: true,
    parseDOM: [{ tag: "hr" }],
    toDOM() {
      return DOMOutput.divider;
    },
  },

  dropdown: {
    attrs: {
      dropdownType: { validate: "string" },
      value: { validate: "string" },
    },
    group: "inline",
    inline: true,
    atom: true,
    leafText(node) {
      return node.attrs.value as string;
    },
  },

  mention: {
    attrs: {
      userId: { validate: "string" },
      displayName: { validate: "string" },
    },
    group: "inline",
    inline: true,
    atom: true,
    leafText(node) {
      return node.attrs.displayName as string;
    },
  },
} as const satisfies Record<string, NodeSpec>;

type KeysWithProperty<T, Key, Value> = {
  [K in keyof T]: Key extends keyof T[K] ? (T[K][Key] extends Value ? K : never) : never;
}[keyof T];

export type BlockNode = KeysWithProperty<typeof nodesSpec, "group", "block">;

const marksSpec = {
  highlight: {
    parseDOM: [{ tag: "mark" }],
    toDOM() {
      return DOMOutput.highlight;
    },
  },

  size: {
    attrs: {
      size: {
        validate(value) {
          if (!Number.isNaN(value) || value < MIN_TEXT_SIZE || value > MAX_TEXT_SIZE) {
            throw new RangeError(`Invalid font size: ${value}`);
          }
        },
      },
    },
    parseDOM: [
      {
        style: "font-size",
        getAttrs(value) {
          let size = parseFloat(value);
          if (Number.isNaN(size)) {
            return false;
          }
          // https://www.w3.org/TR/css-values-3/#absolute-lengths
          if (value.endsWith("pt")) {
            size /= (96 / 72) * 16;
          }
          if (value.endsWith("px")) {
            size /= 16;
          }
          return {
            size: Math.min(Math.max(Math.round(size), MIN_TEXT_SIZE), MAX_TEXT_SIZE),
          };
        },
      },
    ],
    toDOM(mark) {
      const size = Math.min(Math.max(mark.attrs.size as number, MIN_TEXT_SIZE), MAX_TEXT_SIZE);
      return ["span", { style: `font-size: ${size.toFixed(2)}em` }, 0];
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
    parseDOM: [{ tag: "u" }, { tag: ".underline" }, { style: "text-decoration=underline" }],
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

  color: {
    attrs: {
      color: {
        validate(value) {
          if (typeof value !== "string" || !COLOR_HEX_REGEX.test(value)) {
            throw new RangeError(`Invalid color: ${value}`);
          }
        },
      },
    },
    toDOM(mark) {
      const color = mark.attrs.color as string;
      return ["span", { style: `color: ${toCSSColor(color)}` }, 0];
    },
  },

  font: {
    attrs: {
      font: {
        validate(value) {
          if (typeof value !== "string" || !FONT_IDS.includes(value)) {
            throw new RangeError(`Invalid font: ${value}`);
          }
        },
      },
    },
    toDOM(mark) {
      const fontId = mark.attrs.font as FontId;
      return ["span", { style: `font-family: "${getFontConfig(fontId).family}"` }, 0];
    },
  },

  superscript: {
    excludes: "subscript",
    parseDOM: [{ tag: "sup" }],
    toDOM() {
      return DOMOutput.superscript;
    },
  },

  subscript: {
    excludes: "superscript",
    parseDOM: [{ tag: "sub" }],
    toDOM() {
      return DOMOutput.subscript;
    },
  },

  smallCaps: {
    parseDOM: [{ tag: "span.small-caps" }, { style: "font-variant=small-caps" }],
    toDOM() {
      return DOMOutput.smallCaps;
    },
  },

  code: {
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return DOMOutput.code;
    },
  },
} as const satisfies Record<string, MarkSpec>;

export const schema = new Schema<keyof typeof nodesSpec, keyof typeof marksSpec>({
  nodes: nodesSpec,
  marks: marksSpec,
});

export const LIST_NODES = new Set([
  schema.nodes.ordered_list,
  schema.nodes.unordered_list,
  schema.nodes.check_list,
]);
