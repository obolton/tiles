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
  $getRoot,
  $isElementNode,
  $isTextNode,
  $isParagraphNode,
} from "lexical";
import { $isListNode, $isListItemNode } from "@lexical/list";
import type {
  ListNode,
  ListItemNode,
  ParagraphNode,
  RichText,
  TextNode,
} from "./types";
import { TextFormat, ListType } from "./types";

type SerializedNode<T extends LexicalNode> = T extends LexicalParagraphNode
  ? ParagraphNode
  : T extends LexicalListNode
    ? ListNode
    : T extends LexicalListItemNode
      ? ListItemNode
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

function getSpans(node: ElementNode) {
  const spans: TextNode[] = [];
  for (const span of node.getChildren()) {
    if ($isTextNode(span)) {
      spans.push({
        type: "text",
        text: span.getTextContent(),
        format: getTextFormat(span),
      });
    }
  }
  return spans;
}

function serializeNode<T extends LexicalNode>(
  node: T,
): SerializedNode<T> | null {
  if (!$isElementNode(node)) {
    return null;
  }

  if ($isParagraphNode(node)) {
    return { type: "paragraph", spans: getSpans(node) } as SerializedNode<T>;
  }

  if ($isListItemNode(node)) {
    return { type: "listitem", spans: getSpans(node) } as SerializedNode<T>;
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

  return null;
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
