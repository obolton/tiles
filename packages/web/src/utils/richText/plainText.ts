import * as Y from "yjs";
import { TILE_NODE } from "doc/richText/tiles";
import type { RichText, Node } from "doc/types/richText";

export interface PlainTextOptions {
  /** Describes an embedded tile by id. */
  tile?: (id: string) => string;
}

function describeTile({ tile }: PlainTextOptions, id: string): string {
  if (!tile) {
    throw new Error("Embedded tiles need a tile serializer");
  }
  return tile(id);
}

type FragmentChild = Y.XmlElement | Y.XmlText | Y.XmlHook;
type QueueItem = Y.XmlFragment | FragmentChild | string;

/**
 * Extracts plain text from a Y.XmlFragment.
 */
export function fragmentToPlainText(
  fragment: Y.XmlFragment | Y.XmlElement,
  options: PlainTextOptions = {},
): string {
  let output = "";
  const queue: QueueItem[] = [fragment];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (typeof node === "string") {
      output += node;
    } else if (node instanceof Y.XmlText) {
      output += node.toString();
    } else if (node instanceof Y.XmlElement && node.nodeName === TILE_NODE) {
      const id = node.getAttribute("id");
      const text = typeof id === "string" ? describeTile(options, id) : "";
      if (text) {
        queue.push(`${text}\n`);
      }
    } else if (node instanceof Y.XmlElement) {
      queue.push(...node.toArray(), "\n");
    } else if (node instanceof Y.XmlFragment) {
      queue.push(...node.toArray());
    }
  }

  return output;
}

export function toPlainText(input: RichText, options: PlainTextOptions = {}) {
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
        output += node.text;
        break;

      case "dropdown":
      case "date":
        output += node.value;
        break;

      case "mention":
        output += node.displayName;
        break;

      case "paragraph":
      case "heading":
      case "quote":
      case "code":
        queue.push(...node.children, "\n");
        break;

      case "divider":
        queue.push("\n");
        break;

      case "tile": {
        const text = describeTile(options, node.id);
        if (text) {
          queue.push(`${text}\n`);
        }
        break;
      }

      default:
        queue.push(...node.children);
        break;
    }
  }

  return output;
}
