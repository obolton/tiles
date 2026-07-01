import * as Y from "yjs";

type YNode = Y.XmlElement | Y.XmlText | Y.XmlHook;
type Serializer = (node: Y.XmlElement) => string;

const BLOCK_NODES: Record<string, Serializer> = {
  paragraph: serializeParagraph,
  heading: serializeHeading,
  codeBlock: serializeCodeBlock,
  quote: serializeQuote,
  ordered_list: serializeList,
  unordered_list: serializeList,
  check_list: serializeList,
  divider: serializeDivider,
  pending: serializePending,
};

const INLINE_NODES: Record<string, Serializer> = {
  link: serializeLink,
  mention: serializeMention,
  date: serializeDate,
  dropdown: serializeDropdown,
};

/**
 * Serializes a `Y.XmlFragment` of rich text to Markdown.
 */
export function fragmentToMarkdown(fragment: Y.XmlFragment): string {
  return serializeBlocks(fragment.toArray()).trim();
}

function serializeBlocks(nodes: YNode[]): string {
  let output = "";
  for (const node of nodes) {
    if (node instanceof Y.XmlElement) {
      output += BLOCK_NODES[node.nodeName]?.(node) ?? "";
    }
  }
  return output;
}

function serializeParagraph(node: Y.XmlElement): string {
  return `${serializeInline(node)}\n\n`;
}

function serializeHeading(node: Y.XmlElement): string {
  const level = Number(node.getAttribute("level")) || 1;
  return `${"#".repeat(level)} ${serializeInline(node)}\n\n`;
}

function serializeCodeBlock(node: Y.XmlElement): string {
  const language = node.getAttribute("language") ?? "";
  return `\`\`\`${language}\n${serializeInline(node)}\n\`\`\`\n\n`;
}

function serializeQuote(node: Y.XmlElement): string {
  const quoted = serializeBlocks(node.toArray())
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `${quoted}\n\n`;
}

function serializeList(node: Y.XmlElement): string {
  let output = "";
  let index = 0;
  for (const item of node.toArray()) {
    if (item instanceof Y.XmlElement) {
      const marker = listMarker(node, item, ++index);
      output += `${marker} ${serializeListItem(item, marker.length + 1)}\n`;
    }
  }
  return `${output}\n`;
}

function serializeListItem(item: Y.XmlElement, indent: number): string {
  const blocks = item.toArray();
  const head = blocks[0] instanceof Y.XmlElement ? serializeInline(blocks[0]) : "";
  const rest = serializeBlocks(blocks.slice(1)).trim();
  return rest ? `${head}\n${indentLines(rest, indent)}` : head;
}

function indentLines(text: string, indent: number): string {
  const padding = " ".repeat(indent);
  return text
    .split("\n")
    .map((line) => (line ? padding + line : line))
    .join("\n");
}

function listMarker(list: Y.XmlElement, item: Y.XmlElement, index: number): string {
  switch (list.nodeName) {
    case "ordered_list":
      return `${index}.`;
    case "check_list":
      return item.getAttribute("checked") ? "- [x]" : "- [ ]";
    default:
      return "-";
  }
}

function serializeDivider(): string {
  return "---\n\n";
}

function serializePending(node: Y.XmlElement): string {
  return serializeBlocks(node.toArray());
}

function serializeInline(node: Y.XmlElement): string {
  let output = "";
  for (const child of node.toArray()) {
    if (child instanceof Y.XmlText) {
      output += textContent(child);
    } else if (child instanceof Y.XmlElement) {
      output += INLINE_NODES[child.nodeName]?.(child) ?? "";
    }
  }
  return output;
}

function serializeLink(node: Y.XmlElement): string {
  return `[${serializeInline(node)}](${node.getAttribute("href") ?? ""})`;
}

function serializeMention(node: Y.XmlElement): string {
  return `@${node.getAttribute("displayName") ?? ""}`;
}

function serializeDate(node: Y.XmlElement): string {
  const value = node.getAttribute("value") ?? "";
  const time = node.getAttribute("time") as boolean | undefined;
  return time === false ? value.slice(0, 10) : value;
}

function serializeDropdown(node: Y.XmlElement): string {
  return node.getAttribute("value") ?? "";
}

function textContent(text: Y.XmlText): string {
  let output = "";

  const delta: { insert?: unknown }[] = text.toDelta();
  for (const op of delta) {
    if (typeof op.insert === "string") {
      output += op.insert;
    }
  }

  return output;
}
