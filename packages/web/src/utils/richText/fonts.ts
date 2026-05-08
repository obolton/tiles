import type { FontId } from "api/config/fonts";
import type { RichText, Node } from "./types";

export function getRichTextFonts(content: RichText): Set<FontId> {
  const fonts = new Set<FontId>();
  const queue: Node[] = [...content];

  let node: Node | undefined;
  while ((node = queue.shift())) {
    switch (node.type) {
      case "text":
      case "date":
      case "dropdown":
      case "mention":
        if (node.font) {
          fonts.add(node.font);
        }
        break;

      case "divider":
        break;

      default:
        queue.push(...node.children);
        break;
    }
  }

  return fonts;
}
