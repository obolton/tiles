import { escapeUTF8 } from "entities";

// https://developer.mozilla.org/en-US/docs/Glossary/Void_element
export const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

export type Attributes = Record<
  string,
  string | boolean | number | bigint | null | undefined
>;

function serializeAttributes(attributes: Attributes): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    if (value === true) {
      parts.push(key);
    } else {
      parts.push(key + '="' + escapeUTF8(String(value)) + '"');
    }
  }

  return parts.join(" ");
}

export function tag(
  name: string,
  attributes: Attributes,
  content?: string,
): string {
  const attrs = serializeAttributes(attributes);
  const open = "<" + name + (attrs ? " " + attrs : "") + ">";

  if (VOID_ELEMENTS.has(name)) {
    return open;
  }

  return open + (content ?? "") + "</" + name + ">";
}

export function escapeTagContents(content: string): string {
  return content.replace(/<\//g, "<\\/");
}
