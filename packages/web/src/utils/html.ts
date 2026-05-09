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

export function openTag(name: string, attributes: Attributes): string {
  const attrs = serializeAttributes(attributes);
  return "<" + name + (attrs ? " " + attrs : "") + ">";
}

export function closeTag(name: string): string {
  return "</" + name + ">";
}

export function tag(
  name: string,
  attributes: Attributes,
  content?: string,
): string {
  const open = openTag(name, attributes);
  if (VOID_ELEMENTS.has(name)) {
    return open;
  }
  return open + (content ?? "") + closeTag(name);
}

export function escapeTagContents(content: string): string {
  return content.replace(/<\//g, "<\\/");
}
