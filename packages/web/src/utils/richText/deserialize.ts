import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createHeadingNode } from "@lexical/rich-text";
import type {
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
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
  node.append(...paragraph.children.map(createLexicalTextNode));
  return node;
}

function createLexicalHeadingNode(heading: HeadingNode) {
  const node = $createHeadingNode("h2");
  node.append(...heading.children.map(createLexicalTextNode));
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
  const nodes = content
    .split("\n")
    .map((line) => $createParagraphNode().append($createTextNode(line)));
  root.append(...nodes);
}
