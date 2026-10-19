import * as Y from "yjs";
import type { FontId } from "fonts/config";
import type { RichText, Node } from "doc/types/richText";

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

export function getFragmentFonts(fragment: Y.XmlFragment): Set<FontId> {
  const fonts = new Set<FontId>();
  const texts = fragment.createTreeWalker(
    (node) => node instanceof Y.XmlText,
  ) as Iterable<Y.XmlText>;

  for (const text of texts) {
    for (const { attributes } of text.toDelta()) {
      const font = (attributes?.font as { font?: FontId } | undefined)?.font;
      if (font) {
        fonts.add(font);
      }
    }
  }

  return fonts;
}
