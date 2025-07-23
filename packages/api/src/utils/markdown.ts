const BOLD_START_MATCH = /^(\*\*|__)(?=\w)/;
const BOLD_END_MATCH = /^(\*\*|__)/;
const ITALIC_START_MATCH = /^(\*|_)(?=\w)/;
const ITALIC_END_MATCH = /^(\*|_)/;
const NEW_LINE_MATCH = /^\n/;
const PARAGRAPH_MATCH = /^[^\n]*\n{2,}(?=\S)/;
const HEADING_MATCH = /^(#{1,6})\s+(?=\S)/;
const UNORDERED_LIST_ITEM_MATCH = /^( *)(-|\*|\+)\s+(?=\S)/;
const ORDERED_LIST_ITEM_MATCH = /^( *)[0-9]+\.\s+(?=\S)/;

export interface ParagraphNode {
  type: "paragraph";
}

export interface HeadingNode {
  type: "heading";
  level: number;
}

export interface ListItemNode {
  type: "listitem";
  listType: "ordered" | "unordered";
  depth: number;
}

export type RichTextNode = ParagraphNode | HeadingNode | ListItemNode;

export type RichTextStreamEvent =
  | string
  | { bold: boolean }
  | { italic: boolean }
  | RichTextNode;

export async function* parseMarkdown(
  input: AsyncGenerator<string>,
): AsyncGenerator<RichTextStreamEvent> {
  let buffer = "";
  let bold = false;
  let italic = false;
  let newLine = true;
  let node: RichTextNode | null = null;

  function* flush(text?: string) {
    if (node) {
      yield node;
      node = null;
    }
    if (text) {
      yield text;
    }
  }

  for await (const chunk of input) {
    buffer += chunk;

    while (buffer.length > 0) {
      if (newLine) {
        const headingMatch = buffer.match(HEADING_MATCH);
        if (headingMatch) {
          const level = headingMatch[1]!.length;
          node = { type: "heading", level: Math.min(level, 3) };
          buffer = buffer.slice(headingMatch[0].length);
          newLine = false;
          continue;
        }

        const unorderedListItemMatch = buffer.match(UNORDERED_LIST_ITEM_MATCH);
        if (unorderedListItemMatch) {
          const depth = Math.floor(
            (unorderedListItemMatch[1] ?? "").length / 2,
          );
          node = { type: "listitem", listType: "unordered", depth };
          buffer = buffer.slice(unorderedListItemMatch[0].length);
          newLine = false;
          continue;
        }

        const orderedListItemMatch = buffer.match(ORDERED_LIST_ITEM_MATCH);
        if (orderedListItemMatch) {
          const depth = Math.floor((orderedListItemMatch[1] ?? "").length / 2);
          node = { type: "listitem", listType: "ordered", depth };
          buffer = buffer.slice(orderedListItemMatch[0].length);
          newLine = false;
          continue;
        }
      }

      if (!bold && buffer.match(BOLD_START_MATCH)) {
        bold = true;
        yield* flush();
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
        yield* flush();
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
        yield* flush(text);
        node = { type: "paragraph" };
        buffer = buffer.slice(paragraphMatch[0].length);
        newLine = true;
        continue;
      }

      const newLineMatch = buffer.match(NEW_LINE_MATCH);
      if (newLineMatch) {
        buffer = buffer.slice(newLineMatch[0].length);
        newLine = true;
        continue;
      }

      const delimiterMatch = buffer.match(/\*|_|^-|^[0-9]+|^#|\n/);
      if (delimiterMatch) {
        const index = delimiterMatch.index ?? 0;
        if (index === 0) {
          break;
        }

        const text = buffer.slice(0, index);
        yield* flush(text);
        buffer = buffer.slice(index);
        newLine = false;
        continue;
      }

      if (buffer) {
        yield* flush(buffer);
        buffer = "";
        newLine = false;
      }
    }
  }

  yield* flush(buffer);
}
