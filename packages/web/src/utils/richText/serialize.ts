import type {
  EditorState,
  TextNode as LexicalTextNode,
  ParagraphNode as LexicalParagraphNode,
  LexicalNode,
  ElementNode,
} from "lexical";
import type {
  ListNode as LexicalListNode,
  ListItemNode as LexicalListItemNode,
} from "@lexical/list";
import {
  $isHeadingNode,
  HeadingNode as LexicalHeadingNode,
} from "@lexical/rich-text";
import { $getRoot, $isTextNode, $isParagraphNode } from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import type {
  ListNode,
  ListItemNode,
  ParagraphNode,
  RichText,
  TextNode,
  HeadingNode,
} from "./types";
import { TextFormat, ListType } from "./types";

type SerializedNode<T extends LexicalNode> = T extends LexicalParagraphNode
  ? ParagraphNode
  : T extends LexicalHeadingNode
    ? HeadingNode
    : T extends LexicalListNode
      ? ListNode
      : T extends LexicalListItemNode
        ? ListItemNode
        : T extends LexicalTextNode
          ? TextNode
          : null;

function getTextFormat(node: LexicalTextNode) {
  return (
    (node.hasFormat("bold") ? TextFormat.BOLD : 0) |
    (node.hasFormat("italic") ? TextFormat.ITALIC : 0) |
    (node.hasFormat("strikethrough") ? TextFormat.STRIKETHROUGH : 0) |
    (node.hasFormat("underline") ? TextFormat.UNDERLINE : 0)
  );
}

function getListType(node: LexicalListNode) {
  return node.getListType() === "number"
    ? ListType.ORDERED
    : ListType.UNORDERED;
}

function getChildren(node: ElementNode) {
  const spans: (TextNode | ListNode)[] = [];
  for (const span of node.getChildren()) {
    if ($isListNode(span) || $isTextNode(span)) {
      const serializedNode = serializeNode(span);
      if (serializedNode) {
        spans.push(serializedNode);
      }
    }
  }
  return spans;
}

function serializeNode<T extends LexicalNode>(
  node: T,
): SerializedNode<T> | null {
  if ($isTextNode(node)) {
    return {
      type: "text",
      text: node.getTextContent(),
      format: getTextFormat(node),
    } as SerializedNode<T>;
  }

  if ($isParagraphNode(node)) {
    return {
      type: "paragraph",
      children: getChildren(node),
    } as SerializedNode<T>;
  }

  if ($isHeadingNode(node)) {
    return {
      type: "heading",
      children: getChildren(node),
    } as SerializedNode<T>;
  }

  if ($isListItemNode(node)) {
    return {
      type: "listitem",
      value: node.getValue(),
      children: getChildren(node),
    } as SerializedNode<T>;
  }

  if ($isListNode(node)) {
    const children: ListItemNode[] = [];
    const listType = getListType(node);
    for (const child of node.getChildren()) {
      if ($isListItemNode(child)) {
        const serializedNode = serializeNode(child);
        if (serializedNode) {
          children.push(serializedNode);
        }
      }
    }
    return { type: "list", listType, children } as SerializedNode<T>;
  }

  throw new Error(`Unsupported node type: ${node.getType()}`);
}

export function serialize(editorState: EditorState) {
  const serialized: RichText = [];
  editorState.read(() => {
    for (const node of $getRoot().getChildren()) {
      const serializedNode = serializeNode(node);
      if (serializedNode) {
        serialized.push(serializedNode);
      }
    }
  });
  return serialized;
}
