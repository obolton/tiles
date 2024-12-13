import {
  $createParagraphNode,
  $createTextNode,
  $createLineBreakNode,
  $getRoot,
} from "lexical";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createLinkNode } from "@lexical/link";
import type {
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  LinkNode,
  QuoteNode,
  RichText,
  Node,
} from "./types";
import { TextFormat, ListType } from "./types";

function createLexicalTextNode(text: TextNode) {
  const textNode = $createTextNode(text.text);
  if (text.format & TextFormat.BOLD) {
    textNode.toggleFormat("bold");
  }
  if (text.format & TextFormat.ITALIC) {
    textNode.toggleFormat("italic");
  }
  if (text.format & TextFormat.STRIKETHROUGH) {
    textNode.toggleFormat("strikethrough");
  }
  if (text.format & TextFormat.UNDERLINE) {
    textNode.toggleFormat("underline");
  }
  return textNode;
}

function createLexicalParagraphNode(paragraph: ParagraphNode) {
  const node = $createParagraphNode();
  node.append(...paragraph.children.map(createLexicalNode));
  return node;
}

function createLexicalHeadingNode(heading: HeadingNode) {
  const node = $createHeadingNode("h2");
  node.append(...heading.children.map(createLexicalNode));
  return node;
}

function createLexicalLinkNode(link: LinkNode) {
  const node = $createLinkNode(link.url);
  node.append(...link.children.map(createLexicalTextNode));
  return node;
}

function createLexicalQuoteNode(quote: QuoteNode) {
  const node = $createQuoteNode();
  node.append(...quote.children.map(createLexicalNode));
  return node;
}

function createLexicalListNode(list: ListNode) {
  const node = $createListNode(
    list.listType === ListType.ORDERED ? "number" : "bullet",
  );
  node.append(...list.children.map(createLexicalListItemNode));
  return node;
}

function createLexicalListItemNode(listItem: ListItemNode) {
  const node = $createListItemNode();
  node.setValue(listItem.value);
  node.append(...listItem.children.map(createLexicalNode));
  return node;
}

function createLexicalNode(node: Node) {
  const type = node.type;
  switch (type) {
    case "text":
      return createLexicalTextNode(node);
    case "paragraph":
      return createLexicalParagraphNode(node);
    case "heading":
      return createLexicalHeadingNode(node);
    case "link":
      return createLexicalLinkNode(node);
    case "quote":
      return createLexicalQuoteNode(node);
    case "list":
      return createLexicalListNode(node);
    case "listitem":
      return createLexicalListItemNode(node);
    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
}

export function deserialize(content: RichText) {
  return content.map((node) => createLexicalNode(node));
}

export function importNodes(content: RichText) {
  const root = $getRoot();
  const nodes = deserialize(content);
  root.append(...nodes);
}

export function importPlainText(content: string) {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    paragraph.append($createTextNode(line));
    if (i < lines.length - 1) {
      paragraph.append($createLineBreakNode());
    }
  });
  root.append(paragraph);
}
