import type { EditorState } from "prosemirror-state";
import type { Node } from "prosemirror-model";
import type {
  ListItemNode,
  TextNode,
  QuoteNode,
  BlockNode,
  BlockStyle,
  InlineNode,
  Node as SerializedNode,
} from "./types";
import { TextFormat, ListType, TextAlignment } from "./types";
import { schema } from "./schema";

const { nodes, marks } = schema;

function getTextFormat(node: Node): number {
  return node.marks.reduce((format, mark) => {
    switch (mark.type) {
      case marks.bold:
        return format | TextFormat.BOLD;
      case marks.italic:
        return format | TextFormat.ITALIC;
      case marks.strikethrough:
        return format | TextFormat.STRIKETHROUGH;
      case marks.underline:
        return format | TextFormat.UNDERLINE;
      case marks.highlight:
        return format | TextFormat.HIGHLIGHT;
      case marks.superscript:
        return format | TextFormat.SUPERSCRIPT;
      case marks.subscript:
        return format | TextFormat.SUBSCRIPT;
      case marks.smallCaps:
        return format | TextFormat.SMALL_CAPS;
      case marks.code:
        return format | TextFormat.CODE;
      default:
        return format;
    }
  }, 0);
}

function getTextSize(node: Node): number | undefined {
  return schema.marks.size.isInSet(node.marks)?.attrs.size;
}

function getTextColor(node: Node): string | undefined {
  return schema.marks.color.isInSet(node.marks)?.attrs.color;
}

function getTextAlignment(node: Node): TextAlignment | undefined {
  switch (node.attrs.align) {
    case "left":
      return TextAlignment.LEFT;
    case "center":
      return TextAlignment.CENTER;
    case "right":
      return TextAlignment.RIGHT;
    default:
      return undefined;
  }
}

function getBlockStyle(node: Node): BlockStyle {
  return {
    align: getTextAlignment(node),
    lineHeight: node.attrs.lineHeight as number | undefined,
  };
}

function serializeNode(node: Node): SerializedNode {
  if (node.isText) {
    return {
      type: "text",
      text: node.text ?? "",
      format: getTextFormat(node),
      size: getTextSize(node),
      color: getTextColor(node),
      pending: node.marks.find((mark) => mark.type === schema.marks.pending)
        ? true
        : undefined,
    };
  }

  if (node.type === nodes.pending) {
    return {
      type: "pending",
      children: node.children.map(serializeNode) as Exclude<
        BlockNode,
        { type: "pending" }
      >[],
    };
  }

  if (node.type === nodes.link) {
    return {
      type: "link",
      href: node.attrs.href as string,
      theme: node.attrs.theme as string | undefined,
      children: node.children.map(serializeNode) as TextNode[],
    };
  }

  if (node.type === nodes.paragraph) {
    return {
      type: "paragraph",
      ...getBlockStyle(node),
      children: node.children.map(serializeNode) as InlineNode[],
    };
  }

  if (node.type === nodes.heading) {
    return {
      type: "heading",
      level: node.attrs.level as 1 | 2 | 3,
      ...getBlockStyle(node),
      theme: node.attrs.theme as string | undefined,
      children: node.children.map(serializeNode) as InlineNode[],
    };
  }

  if (node.type === nodes.quote) {
    return {
      type: "quote",
      children: node.children.map(serializeNode),
    } as QuoteNode;
  }

  if (node.type === nodes.codeBlock) {
    return {
      type: "code",
      language: node.attrs.language as string,
      children: node.children.map(serializeNode) as TextNode[],
    };
  }

  if (node.type === nodes.list_item) {
    return {
      type: "listitem",
      checked: node.attrs.checked as boolean | undefined,
      children: node.children.map(serializeNode),
    } as ListItemNode;
  }

  if (node.type === nodes.ordered_list) {
    return {
      type: "list",
      listType: ListType.ORDERED,
      children: node.children.map(serializeNode) as ListItemNode[],
    };
  }

  if (node.type === nodes.unordered_list) {
    return {
      type: "list",
      listType: ListType.UNORDERED,
      children: node.children.map(serializeNode) as ListItemNode[],
    };
  }

  if (node.type === nodes.check_list) {
    return {
      type: "list",
      listType: ListType.CHECK,
      children: node.children.map(serializeNode) as ListItemNode[],
    };
  }

  if (node.type === nodes.date) {
    const value = node.attrs.value as Date;
    const time = node.attrs.time as boolean;
    return {
      type: "date",
      value: time ? value.toISOString() : value.toISOString().slice(0, 10),
      format: getTextFormat(node),
      size: getTextSize(node),
      color: getTextColor(node),
      theme: node.attrs.theme as string | undefined,
    };
  }

  if (node.type === nodes.dropdown) {
    const dropdownType = node.attrs.dropdownType as string;
    const value = node.attrs.value as string;
    return {
      type: "dropdown",
      dropdownType,
      value,
      format: getTextFormat(node),
      size: getTextSize(node),
      color: getTextColor(node),
    };
  }

  if (node.type === nodes.mention) {
    return {
      type: "mention",
      userId: node.attrs.userId as string,
      displayName: node.attrs.displayName as string,
      format: getTextFormat(node),
      size: getTextSize(node),
      color: getTextColor(node),
    };
  }

  if (node.type === nodes.divider) {
    return { type: "divider" };
  }

  throw new Error(`Unsupported node type: ${node.type.name}`);
}

export function serialize(editorState: EditorState) {
  return editorState.doc.children.map(serializeNode) as BlockNode[];
}
