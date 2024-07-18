import type { EditorState, TextNode as LexicalTextNode } from "lexical";
import { $getRoot, $isElementNode, $isTextNode } from "lexical";
import type { BlockNodeType, RichText, TextNode } from "./types";
import { TextFormat } from "./types";

function getTextFormat(node: LexicalTextNode) {
  return (
    (node.hasFormat("bold") ? TextFormat.BOLD : 0) |
    (node.hasFormat("italic") ? TextFormat.ITALIC : 0) |
    (node.hasFormat("strikethrough") ? TextFormat.STRIKETHROUGH : 0) |
    (node.hasFormat("underline") ? TextFormat.UNDERLINE : 0)
  );
}

function isValidBlockNode(type: string): type is BlockNodeType {
  return type === "paragraph";
}

export function serialize(editorState: EditorState) {
  const serialized: RichText = [];
  editorState.read(() => {
    for (const element of $getRoot().getChildren()) {
      const type = element.getType();
      if ($isElementNode(element) && isValidBlockNode(type)) {
        const spans: TextNode[] = [];
        for (const span of element.getChildren()) {
          if ($isTextNode(span)) {
            spans.push({
              type: "text",
              text: span.getTextContent(),
              format: getTextFormat(span),
            });
          }
        }
        serialized.push({
          type,
          spans,
        });
      }
    }
  });
  return serialized;
}
