import type { RichText } from "doc/types/richText";

type Node = RichText[number] | { type: string; [key: string]: unknown };

export interface MarkdownOptions {
  tile?: (id: string) => string;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Convert rich text to markdown.
 */
export function toMarkdown(input: RichText, options: MarkdownOptions = {}): string {
  const queue: (Node | string)[] = [...input];
  let output = "";

  let node: Node | string | undefined;
  while ((node = queue.shift())) {
    if (typeof node === "string") {
      output += node;
      continue;
    }

    switch (node.type) {
      case "text":
        output += text(node.text);
        break;

      case "link": {
        const linkText = toMarkdown(node.children as RichText, options);
        output += `[${linkText}](${text(node.href)})`;
        break;
      }

      case "dropdown":
      case "date":
        output += text(node.value);
        break;

      case "mention":
        output += `@${text(node.displayName)}`;
        break;

      case "paragraph":
        queue.push(...(node.children as Node[]), "\n\n");
        break;

      case "heading": {
        const prefix = "#".repeat(node.level as number);
        queue.unshift(`${prefix} `);
        queue.push(...(node.children as Node[]), "\n\n");
        break;
      }

      case "list": {
        const children = node.children as Array<{
          type: string;
          checked?: boolean;
          children: Node[];
        }>;
        for (let i = 0; i < children.length; i++) {
          const item = children[i];
          if (!item) {
            continue;
          }
          let marker: string;
          switch (node.listType) {
            case 0:
              marker = `${i + 1}.`;
              break;
            case 2:
              marker = item.checked ? "- [x]" : "- [ ]";
              break;
            default:
              marker = "-";
              break;
          }
          const itemText = toMarkdown(item.children as RichText, options);
          queue.push(`${marker} ${itemText.trim()}\n`);
        }
        queue.push("\n");
        break;
      }

      case "code": {
        const code = toMarkdown(node.children as RichText, options);
        queue.push(`\`\`\`${text(node.language)}\n${code}\n\`\`\`\n\n`);
        break;
      }

      case "quote": {
        const quoteText = toMarkdown(node.children as RichText, options);
        const quoted = quoteText
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
        queue.push(`${quoted}\n\n`);
        break;
      }

      case "divider":
        queue.push("---\n\n");
        break;

      case "pending":
        queue.push(...(node.children as Node[]));
        break;

      case "tile": {
        if (!options.tile) {
          throw new Error("Embedded tiles need a tile serializer");
        }
        const content = options.tile(text(node.id));
        if (content) {
          queue.push(`${content}\n\n`);
        }
        break;
      }

      default:
        if ("children" in node && Array.isArray(node.children)) {
          queue.push(...(node.children as Node[]));
        }
        break;
    }
  }

  return output.trim();
}
