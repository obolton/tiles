import * as Y from "yjs";
import type { RichText, Node } from "doc/types/richText";

/**
 * Extracts plain text from a Y.XmlFragment.
 */
type FragmentChild = Y.XmlElement | Y.XmlText | Y.XmlHook;
type QueueItem = Y.XmlFragment | FragmentChild | "\n";

export function fragmentToPlainText(fragment: Y.XmlFragment | Y.XmlElement): string {
  let output = "";
  const queue: QueueItem[] = [fragment];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === "\n") {
      output += "\n";
    } else if (node instanceof Y.XmlText) {
      output += node.toString();
    } else if (node instanceof Y.XmlElement) {
      queue.push(...node.toArray(), "\n");
    } else if (node instanceof Y.XmlFragment) {
      queue.push(...node.toArray());
    }
  }

  return output;
}

export function toPlainText(input: RichText) {
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

      default:
        queue.push(...node.children);
        break;
    }
  }

  return output;
}
