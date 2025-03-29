import type { EditorState } from "prosemirror-state";
import type { Node } from "prosemirror-model";
import type {
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  QuoteNode,
  BlockNode,
  Node as SerializedNode,
} from "./types";
import { TextFormat, ListType } from "./types";
import { schema } from "./schema";

const { nodes, marks } = schema;

function getTextFormat(node: Node) {
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
      default:
        return format;
    }
  }, 0);
}

function serializeNode(node: Node): SerializedNode {
  if (node.isText) {
    return {
      type: "text",
      text: node.text ?? "",
      format: getTextFormat(node),
      link: node.marks.find((mark) => mark.type === marks.link)?.attrs.href,
    } as TextNode;
  }

  if (node.type === nodes.paragraph) {
    return {
      type: "paragraph",
      children: node.children.map(serializeNode),
    } as ParagraphNode;
  }

  if (node.type === nodes.heading) {
    return {
      type: "heading",
      level: node.attrs.level,
      children: node.children.map(serializeNode),
    } as HeadingNode;
  }

  if (node.type === nodes.quote) {
    return {
      type: "quote",
      children: node.children.map(serializeNode),
    } as QuoteNode;
  }

  if (node.type === nodes.list_item) {
    return {
      type: "listitem",
      checked: node.attrs.checked,
      children: node.children.map(serializeNode),
    } as ListItemNode;
  }

  if (node.type === nodes.ordered_list) {
    return {
      type: "list",
      listType: ListType.ORDERED,
      children: node.children.map(serializeNode),
    } as ListNode;
  }

  if (node.type === nodes.unordered_list) {
    return {
      type: "list",
      listType: ListType.UNORDERED,
      children: node.children.map(serializeNode),
    } as ListNode;
  }

  if (node.type === nodes.check_list) {
    return {
      type: "list",
      listType: ListType.CHECK,
      children: node.children.map(serializeNode),
    } as ListNode;
  }

  throw new Error(`Unsupported node type: ${node.type.name}`);
}

export function serialize(editorState: EditorState) {
  return editorState.doc.children.map(serializeNode) as BlockNode[];
}
