import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import type { BlockNode, ParagraphNode, RichText } from "./types";
import { TextFormat } from "./types";

function createLexicalParagraphNode(paragraph: ParagraphNode) {
  const node = $createParagraphNode();
  const spans = paragraph.spans.map((span) => {
    const textNode = $createTextNode(span.text);
    if (span.format & TextFormat.BOLD) {
      textNode.toggleFormat("bold");
    }
    if (span.format & TextFormat.ITALIC) {
      textNode.toggleFormat("italic");
    }
    if (span.format & TextFormat.STRIKETHROUGH) {
      textNode.toggleFormat("strikethrough");
    }
    if (span.format & TextFormat.UNDERLINE) {
      textNode.toggleFormat("underline");
    }
    return textNode;
  });
  node.append(...spans);
  return node;
}

function createLexicalNode(node: BlockNode) {
  switch (node.type) {
    case "paragraph":
      return createLexicalParagraphNode(node);
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
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
