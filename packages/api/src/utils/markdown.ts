const BOLD_START_MATCH = /^(\*\*|__)(?=\w)/;
const BOLD_END_MATCH = /^(\*\*|__)/;
const ITALIC_START_MATCH = /^(\*|_)(?=\w)/;
const ITALIC_END_MATCH = /^(\*|_)/;
const NEW_LINE_MATCH = /^[^\n]*\n/;
const PARAGRAPH_MATCH = /^[^\n]*\n{2,}(?=\w)/;
const HEADING_MATCH = /^(#{1,6})\s+(?=\S)/;
const UNORDERED_LIST_ITEM_MATCH = /^(-|\*|\+)\s+(?=\S)/;
const ORDERED_LIST_ITEM_MATCH = /^[0-9]+\.\s+(?=\S)/;

export type MarkdownBlockType = "P" | "H1" | "H2" | "H3" | "UL" | "OL";

export type MarkdownStreamEvent =
  | string
  | { bold: boolean }
  | { italic: boolean }
  | { block: MarkdownBlockType };

export async function* parseMarkdown(
  input: AsyncGenerator<string>,
): AsyncGenerator<MarkdownStreamEvent> {
  let buffer = "";
  let bold = false;
  let italic = false;
  let newLine = true;

  for await (const chunk of input) {
    buffer += chunk;

    while (buffer.length > 0) {
      if (newLine) {
        const headingMatch = buffer.match(HEADING_MATCH);
        if (headingMatch) {
          const level = headingMatch[1]!.length;
          const block = level === 1 ? "H1" : level === 2 ? "H2" : "H3";
          yield { block };
          buffer = buffer.slice(headingMatch[0].length);
          newLine = false;
          continue;
        }

        const unorderedListItemMatch = buffer.match(UNORDERED_LIST_ITEM_MATCH);
        if (unorderedListItemMatch) {
          yield { block: "UL" };
          buffer = buffer.slice(unorderedListItemMatch[0].length);
          newLine = false;
          continue;
        }

        const orderedListItemMatch = buffer.match(ORDERED_LIST_ITEM_MATCH);
        if (orderedListItemMatch) {
          yield { block: "OL" };
          buffer = buffer.slice(orderedListItemMatch[0].length);
          newLine = false;
          continue;
        }
      }

      if (!bold && buffer.match(BOLD_START_MATCH)) {
        bold = true;
        yield { bold };
        buffer = buffer.slice(2);
        newLine = false;
        continue;
      }

      if (bold && buffer.match(BOLD_END_MATCH)) {
        bold = false;
        yield { bold };
        buffer = buffer.slice(2);
        newLine = false;
        continue;
      }

      if (!italic && buffer.match(ITALIC_START_MATCH)) {
        italic = true;
        yield { italic };
        buffer = buffer.slice(1);
        newLine = false;
        continue;
      }

      if (italic && buffer.match(ITALIC_END_MATCH)) {
        italic = false;
        yield { italic };
        buffer = buffer.slice(1);
        newLine = false;
        continue;
      }

      const paragraphMatch = buffer.match(PARAGRAPH_MATCH);
      if (paragraphMatch) {
        const text = paragraphMatch[0].trimEnd();
        if (text) {
          yield text;
        }
        yield { block: "P" };
        buffer = buffer.slice(paragraphMatch[0].length);
        newLine = true;
        continue;
      }

      const newLineMatch = buffer.match(NEW_LINE_MATCH);
      if (newLineMatch) {
        const text = newLineMatch[0].replace(/\n/, "");
        if (text) {
          yield text;
        }
        buffer = buffer.slice(newLineMatch[0].length);
        newLine = true;
        continue;
      }

      const delimiterMatch = buffer.match(/\*|_|-|\n/);
      if (delimiterMatch) {
        const index = delimiterMatch.index ?? 0;
        if (index === 0) {
          break;
        }

        const text = buffer.slice(0, index);
        yield text;
        buffer = buffer.slice(index);
        newLine = false;
        continue;
      }

      if (buffer) {
        yield buffer;
        buffer = "";
        newLine = false;
      }
    }
  }

  if (buffer) {
    yield buffer;
  }
}
