const BOLD_START_MATCH = /^(\*\*|__)(?=\w)/;
const BOLD_END_MATCH = /^(\*\*|__)/;
const ITALIC_START_MATCH = /^(\*|_)(?=\w)/;
const ITALIC_END_MATCH = /^(\*|_)/;
const NEW_LINE_MATCH = /^\n+/;
const HEADING_MATCH = /^(#{1,6})\s+(?=\S)/;
const UNORDERED_LIST_ITEM_MATCH = /^( *)(-|\*|\+)\s+(?=\S)/;
const ORDERED_LIST_ITEM_MATCH = /^( *)[0-9]+\.\s+(?=\S)/;
const DELIMITER_MATCH = /(\*|_|-( *)|[0-9]\.?|#( *))$/;

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

export type RichTextFormat = { bold?: boolean; italic?: boolean };

export type RichTextStreamEvent = string | RichTextFormat | RichTextNode;

export async function* parseMarkdown(
  input: AsyncGenerator<string>,
): AsyncGenerator<RichTextStreamEvent> {
  let buffer = "";
  let pos = 0;
  const format: RichTextFormat = {};
  let node: RichTextNode | null = null;

  function* flush(skip: number = 0) {
    if (pos > 0) {
      const text = buffer.slice(0, pos);

      // Ignore whitespace-only chunks
      if (text.trim().length > 0) {
        if (!node) {
          node = { type: "paragraph" };
          yield node;
        }
        yield text;
      }
    }
    buffer = buffer.slice(pos + skip);
    pos = 0;
  }

  function* set(
    state: {
      node?: RichTextNode | null;
      format?: RichTextFormat;
    },
    skip: number,
  ) {
    yield* flush(skip);

    if (typeof state.node !== "undefined") {
      node = state.node;
      if (node) {
        yield node;
      }
    }

    if (state.format) {
      if (!node) {
        node = { type: "paragraph" };
        yield node;
      }
      yield state.format;
      Object.assign(format, state.format);
    }
  }

  for await (const chunk of input) {
    buffer += chunk;
    pos = 0;

    while (pos < buffer.length) {
      const rest = buffer.slice(pos);

      const headingMatch = buffer.match(HEADING_MATCH);
      if (headingMatch) {
        const [match, hashes] = headingMatch;
        const level = Math.min(hashes!.length, 3);
        yield* set(
          {
            node: {
              type: "heading",
              level,
            },
          },
          match.length,
        );
        continue;
      }

      const ulMatch = buffer.match(UNORDERED_LIST_ITEM_MATCH);
      if (ulMatch) {
        const [match, whitespace] = ulMatch;
        const depth = Math.floor((whitespace ?? "").length / 2);
        yield* set(
          {
            node: {
              type: "listitem",
              listType: "unordered",
              depth,
            },
          },
          match.length,
        );
        continue;
      }

      const olMatch = buffer.match(ORDERED_LIST_ITEM_MATCH);
      if (olMatch) {
        const [match, whitespace] = olMatch;
        const depth = Math.floor((whitespace ?? "").length / 2);
        yield* set(
          {
            node: {
              type: "listitem",
              listType: "ordered",
              depth,
            },
          },
          match.length,
        );
        continue;
      }

      if (!format.bold && rest.match(BOLD_START_MATCH)) {
        yield* set({ format: { bold: true } }, 2);
        continue;
      }

      if (format.bold && rest.match(BOLD_END_MATCH)) {
        yield* set({ format: { bold: false } }, 2);
        continue;
      }

      if (!format.italic && rest.match(ITALIC_START_MATCH)) {
        yield* set({ format: { italic: true } }, 1);
        continue;
      }

      if (format.italic && rest.match(ITALIC_END_MATCH)) {
        yield* set({ format: { italic: false } }, 1);
        continue;
      }

      const newLineMatch = rest.match(NEW_LINE_MATCH);
      if (newLineMatch) {
        yield* set({ node: null }, newLineMatch[0].length);
        continue;
      }

      pos += 1;
    }

    const delimiterMatch = buffer.match(DELIMITER_MATCH);
    if (!delimiterMatch) {
      yield* flush();
    }
  }

  yield* flush();
}
