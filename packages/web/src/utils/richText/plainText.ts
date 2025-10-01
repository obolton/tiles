import type { RichText, Node } from "./types";

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

      case "paragraph":
      case "heading":
      case "quote":
      case "code":
        queue.push(...node.children, "\n");
        break;

      default:
        queue.push(...node.children);
        break;
    }
  }

  return output;
}
