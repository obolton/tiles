import type * as Y from "yjs";
import { fragmentToRichText } from "../richText/serialize";
import { ListType } from "../types/richText";
import type { BlockNode, CodeNode, ListItemNode, ListNode, RichText } from "../types/richText";
import { inlineToMarkdown } from "./inline";

export interface MarkdownOptions {
  /** Renders an embedded tile by id. */
  tile?: (id: string) => string;
}

/**
 * Serializes rich text JSON to Markdown.
 */
export function richTextToMarkdown(content: RichText, options: MarkdownOptions = {}): string {
  return content
    .map((block) => renderBlock(block, options))
    .filter((rendered) => rendered.length > 0)
    .join("\n\n");
}

/**
 * Serializes a `Y.XmlFragment` of rich text to Markdown.
 */
export function fragmentToMarkdown(fragment: Y.XmlFragment, options: MarkdownOptions = {}): string {
  return richTextToMarkdown(fragmentToRichText(fragment), options);
}

function renderBlock(block: BlockNode, options: MarkdownOptions): string {
  switch (block.type) {
    case "paragraph":
      return inlineToMarkdown(block.children).trim();
    case "heading": {
      const text = inlineToMarkdown(block.children).trim();
      return text ? `${"#".repeat(block.level)} ${text}` : "";
    }
    case "quote": {
      const quoted = richTextToMarkdown(block.children, options);
      return quoted ? prefixLines(quoted, "> ", ">") : "";
    }
    case "list":
      return renderList(block, options);
    case "code":
      return renderCode(block);
    case "divider":
      return "---";
    case "pending":
      return richTextToMarkdown(block.children, options);
    case "tile":
      return renderEmbeddedTile(block.id, options);
  }
}

function renderList(list: ListNode, options: MarkdownOptions): string {
  return list.children.map((item, index) => renderListItem(list, item, index, options)).join("\n");
}

function renderListItem(
  list: ListNode,
  item: ListItemNode,
  index: number,
  options: MarkdownOptions,
): string {
  const marker = listMarker(list, item, index);
  // Continuation lines align with the item's content, which follows the marker and a space
  const indent = " ".repeat(list.listType === ListType.ORDERED ? marker.length + 1 : 2);
  const [first, ...rest] = item.children;
  const paragraph = first?.type === "paragraph" ? first : null;
  const head = paragraph ? inlineToMarkdown(paragraph.children).trim() : "";
  const blocks = paragraph ? rest : item.children;

  let output = head ? `${marker} ${head}` : marker;
  for (const block of blocks) {
    const rendered = renderBlock(block, options);
    if (rendered) {
      // A nested list continues the item directly; anything else needs a blank line
      const separator = block.type === "list" ? "\n" : "\n\n";
      output += separator + prefixLines(rendered, indent, "");
    }
  }
  return output;
}

function listMarker(list: ListNode, item: ListItemNode, index: number): string {
  switch (list.listType) {
    case ListType.ORDERED:
      return `${index + 1}.`;
    case ListType.CHECK:
      return item.checked ? "- [x]" : "- [ ]";
    case ListType.UNORDERED:
      return "-";
  }
}

function renderCode(block: CodeNode): string {
  const text = block.children.map((child) => child.text).join("");
  return `\`\`\`${block.language}\n${text}\n\`\`\``;
}

function renderEmbeddedTile(id: string, options: MarkdownOptions): string {
  if (!options.tile) {
    throw new Error("Embedded tiles need a tile serializer");
  }
  return options.tile(id).trim();
}

function prefixLines(text: string, prefix: string, empty: string): string {
  return text
    .split("\n")
    .map((line) => (line ? prefix + line : empty))
    .join("\n");
}
