import * as Y from "yjs";
import { ListType, TextAlignment, TextFormat } from "../types/richText";
import type {
  BlockNode,
  BlockStyle,
  InlineNode,
  ListItemNode,
  PendingNode,
  QuoteNode,
  RichText,
  TextNode,
} from "../types/richText";

type Child = Y.XmlElement | Y.XmlText | Y.XmlHook;
type Attributes = Record<string, unknown>;

interface DeltaOp {
  insert?: unknown;
  attributes?: Attributes;
}

/** y-prosemirror suffixes the key of an overlapping mark with a hash of its attrs. */
const MARK_HASH = /--[a-zA-Z0-9+/=]{8}$/;

const FORMAT_MARKS: Record<string, TextFormat> = {
  bold: TextFormat.BOLD,
  italic: TextFormat.ITALIC,
  strikethrough: TextFormat.STRIKETHROUGH,
  underline: TextFormat.UNDERLINE,
  highlight: TextFormat.HIGHLIGHT,
  superscript: TextFormat.SUPERSCRIPT,
  subscript: TextFormat.SUBSCRIPT,
  smallCaps: TextFormat.SMALL_CAPS,
  code: TextFormat.CODE,
};

const ALIGNMENTS: Record<string, TextAlignment> = {
  left: TextAlignment.LEFT,
  center: TextAlignment.CENTER,
  right: TextAlignment.RIGHT,
  justify: TextAlignment.JUSTIFY,
};

/**
 * Converts a `Y.XmlFragment` of rich text, as the editor writes it, to rich text JSON. Produces
 * the same shape as the web's ProseMirror-based serializer without depending on ProseMirror.
 */
export function fragmentToRichText(fragment: Y.XmlFragment): RichText {
  return toBlocks(fragment.toArray());
}

function toBlocks(children: Child[]): BlockNode[] {
  const blocks: BlockNode[] = [];
  for (const child of children) {
    const block = child instanceof Y.XmlElement ? toBlock(child) : null;
    if (block) {
      blocks.push(block);
    }
  }
  return blocks;
}

function toBlock(element: Y.XmlElement): BlockNode | null {
  const attrs: Attributes = element.getAttributes();
  switch (element.nodeName) {
    case "paragraph":
      return { type: "paragraph", ...blockStyle(attrs), children: toInline(element) };
    case "heading":
      return {
        type: "heading",
        level: headingLevel(attrs.level),
        ...blockStyle(attrs),
        ...(typeof attrs.theme === "string" && { theme: attrs.theme }),
        children: toInline(element),
      };
    case "quote":
      return { type: "quote", children: toBlocks(element.toArray()).filter(isQuoteChild) };
    case "ordered_list":
      return toList(element, ListType.ORDERED);
    case "unordered_list":
      return toList(element, ListType.UNORDERED);
    case "check_list":
      return toList(element, ListType.CHECK);
    case "codeBlock":
      return {
        type: "code",
        language: getString(attrs.language) ?? "",
        lineNumbers: attrs.lineNumbers === true,
        children: toText(element),
      };
    case "divider":
      return { type: "divider" };
    case "pending":
      return { type: "pending", children: toBlocks(element.toArray()).filter(isPendingChild) };
    case "tile": {
      const id = getString(attrs.id);
      return id === undefined ? null : { type: "tile", id };
    }
    default:
      return null;
  }
}

function toList(element: Y.XmlElement, listType: ListType): BlockNode {
  const children: ListItemNode[] = [];
  for (const child of element.toArray()) {
    if (child instanceof Y.XmlElement && child.nodeName === "list_item") {
      const attrs: Attributes = child.getAttributes();
      children.push({
        type: "listitem",
        checked: attrs.checked === true,
        children: toBlocks(child.toArray()),
      });
    }
  }
  return { type: "list", listType, children };
}

function toInline(element: Y.XmlElement): InlineNode[] {
  const nodes: InlineNode[] = [];
  for (const child of element.toArray()) {
    if (child instanceof Y.XmlText) {
      nodes.push(...toText(child));
    } else if (child instanceof Y.XmlElement) {
      const node = toInlineElement(child);
      if (node) {
        nodes.push(node);
      }
    }
  }
  return nodes;
}

function toInlineElement(element: Y.XmlElement): InlineNode | null {
  const attrs: Attributes = element.getAttributes();
  switch (element.nodeName) {
    case "link":
      return {
        type: "link",
        href: getString(attrs.href) ?? "",
        ...(typeof attrs.theme === "string" && { theme: attrs.theme }),
        children: toText(element),
      };
    case "date": {
      const value = getString(attrs.value) ?? "";
      return {
        type: "date",
        value: attrs.time === false ? value.slice(0, 10) : value,
        format: TextFormat.NONE,
        theme: getString(attrs.theme) ?? null,
      };
    }
    case "dropdown":
      return {
        type: "dropdown",
        dropdownType: getString(attrs.dropdownType) ?? "",
        value: getString(attrs.value) ?? "",
        format: TextFormat.NONE,
      };
    case "mention":
      return {
        type: "mention",
        userId: getString(attrs.userId) ?? "",
        displayName: getString(attrs.displayName) ?? "",
        format: TextFormat.NONE,
      };
    default:
      return null;
  }
}

/** The text runs of a text node, or of the text nodes directly within an element. */
function toText(node: Y.XmlText | Y.XmlElement): TextNode[] {
  if (node instanceof Y.XmlElement) {
    return node.toArray().flatMap((child) => (child instanceof Y.XmlText ? toText(child) : []));
  }
  const delta: DeltaOp[] = node.toDelta();
  return delta.flatMap((op) =>
    typeof op.insert === "string" ? [textNode(op.insert, op.attributes ?? {})] : [],
  );
}

function textNode(text: string, attributes: Attributes): TextNode {
  const node: TextNode = { type: "text", text, format: TextFormat.NONE };
  for (const [key, value] of Object.entries(attributes)) {
    const name = key.replace(MARK_HASH, "");
    const format = FORMAT_MARKS[name];
    if (format !== undefined) {
      node.format |= format;
      continue;
    }
    const attr = getProperty(value, name);
    switch (name) {
      case "size":
        if (typeof attr === "number") {
          node.size = attr;
        }
        break;
      case "color":
        if (typeof attr === "string") {
          node.color = attr;
        }
        break;
      case "font":
        if (typeof attr === "string") {
          node.font = attr;
        }
        break;
    }
  }
  return node;
}

function blockStyle(attrs: Attributes): BlockStyle {
  const align = typeof attrs.align === "string" ? ALIGNMENTS[attrs.align] : undefined;
  return {
    ...(align !== undefined && { align }),
    ...(typeof attrs.lineHeight === "number" && { lineHeight: attrs.lineHeight }),
    ...(typeof attrs.indent === "number" && { indent: attrs.indent }),
  };
}

function headingLevel(level: unknown): 1 | 2 | 3 {
  return level === 1 || level === 2 || level === 3 ? level : 1;
}

function isQuoteChild(node: BlockNode): node is QuoteNode["children"][number] {
  return node.type !== "quote" && node.type !== "pending";
}

function isPendingChild(node: BlockNode): node is PendingNode["children"][number] {
  return node.type !== "pending";
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getProperty(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}
