import type { Transformer } from "node:stream/web";

const BOLD_START_MATCH = /^(\*\*|__)(?=\w)/;
const BOLD_END_MATCH = /^(\*\*|__)/;
const ITALIC_START_MATCH = /^(\*|_)(?=\w)/;
const ITALIC_END_MATCH = /^(\*|_)/;
const HARD_LINE_BREAK_MATCH = /^[ \t]{2,}\n/;
const LINE_BREAK_MATCH = /^(\s*\n)+/;
const HEADING_MATCH = /^(#{1,6})\s+(?=\S)/;
const UNORDERED_LIST_ITEM_MATCH = /^( *)(-|\*|\+)\s+(?=\S)/;
const ORDERED_LIST_ITEM_MATCH = /^( *)[0-9]+\.\s+(?=\S)/;
const BLOCK_START_MATCH = /^>>>\s+(.+)\s*\n/;
const BLOCK_END_MATCH = /^<<<\s*\n/;
const BLOCK_END_EOF_MATCH = /^<<<\s*$/;
const DIVIDER_MATCH = /^(-{3,}|\*{3,}|_{3,})\s*\n/;
const DELIMITER_MATCH = /(\*|_|-( *)|[0-9]\.?|#( *)|>|<)/;
const ALL_NEW_LINES_MATCH = /\n/g;

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

export interface DividerNode {
  type: "divider";
}

export type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListItemNode
  | DividerNode;

export interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
}

export interface Destination {
  destination: string | null;
}

export type RichTextStreamEvent =
  | string
  | RichTextFormat
  | RichTextNode
  | Destination;

enum LineBreak {
  HARD,
  SOFT,
}

export class MarkdownTransformer implements Transformer<
  string,
  RichTextStreamEvent
> {
  private buffer = "";
  private pos = 0;
  private format: RichTextFormat = {};
  private node: RichTextNode | null = null;
  private lineBreak: LineBreak | null = null;
  private destination: string | null = null;

  start() {}

  private advance(
    controller: TransformStreamDefaultController<RichTextStreamEvent>,
    skip: number = 0,
  ) {
    if (this.pos === 0) {
      this.buffer = this.buffer.slice(skip);
      return;
    }

    const text = this.buffer.slice(0, this.pos);

    // Buffer until we have a non-empty chunk
    if (text.trim().length === 0) {
      return;
    }

    if (!this.node) {
      this.node = { type: "paragraph" };
      controller.enqueue(this.node);
    }

    if (this.lineBreak !== null) {
      switch (this.lineBreak) {
        case LineBreak.HARD:
          controller.enqueue("\n" + text);
          break;
        case LineBreak.SOFT:
          controller.enqueue(" " + text);
          break;
      }
      this.lineBreak = null;
    } else {
      controller.enqueue(text);
    }

    this.buffer = this.buffer.slice(this.pos + skip);
    this.pos = 0;
  }

  private set(
    controller: TransformStreamDefaultController<RichTextStreamEvent>,
    state: {
      node?: RichTextNode | null;
      format?: RichTextFormat;
      lineBreak?: LineBreak | null;
      destination?: string | null;
    },
    skip: number,
  ) {
    this.advance(controller, skip);

    if (state.destination !== undefined) {
      this.destination = state.destination;
      this.format = {};
      this.node = null;
      this.lineBreak = null;
      controller.enqueue({ destination: this.destination });
    }

    if (state.node !== undefined) {
      this.node = state.node;
      this.lineBreak = null;
      if (this.node) {
        controller.enqueue(this.node);
      }
    }

    if (state.format) {
      if (!this.node) {
        this.node = { type: "paragraph" };
        controller.enqueue(this.node);
      }
      controller.enqueue(state.format);
      Object.assign(this.format, state.format);
    }

    if (state.lineBreak !== undefined) {
      this.lineBreak = state.lineBreak;
    }
  }

  transform(
    chunk: string,
    controller: TransformStreamDefaultController<RichTextStreamEvent>,
  ) {
    this.buffer += chunk;
    this.pos = 0;

    while (this.pos < this.buffer.length) {
      const rest = this.buffer.slice(this.pos);

      const blockStartMatch = this.buffer.match(BLOCK_START_MATCH);
      if (blockStartMatch) {
        const [match, id] = blockStartMatch;
        this.set(controller, { destination: id ?? "" }, match.length);
        continue;
      }

      const blockEndMatch = this.buffer.match(BLOCK_END_MATCH);
      if (blockEndMatch) {
        this.set(controller, { destination: null }, blockEndMatch[0].length);
        continue;
      }

      const headingMatch = this.buffer.match(HEADING_MATCH);
      if (headingMatch) {
        const [match, hashes] = headingMatch;
        const level = Math.min(hashes!.length, 3);
        this.set(
          controller,
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

      const dividerMatch = this.buffer.match(DIVIDER_MATCH);
      if (dividerMatch) {
        this.set(
          controller,
          { node: { type: "divider" } },
          dividerMatch[0].length,
        );
        this.node = null;
        continue;
      }

      const ulMatch = this.buffer.match(UNORDERED_LIST_ITEM_MATCH);
      if (ulMatch) {
        const [match, whitespace] = ulMatch;
        const depth = Math.floor((whitespace ?? "").length / 2);
        this.set(
          controller,
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

      const olMatch = this.buffer.match(ORDERED_LIST_ITEM_MATCH);
      if (olMatch) {
        const [match, whitespace] = olMatch;
        const depth = Math.floor((whitespace ?? "").length / 2);
        this.set(
          controller,
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

      if (!this.format.bold && rest.match(BOLD_START_MATCH)) {
        this.set(controller, { format: { bold: true } }, 2);
        continue;
      }

      if (this.format.bold && rest.match(BOLD_END_MATCH)) {
        this.set(controller, { format: { bold: false } }, 2);
        continue;
      }

      if (!this.format.italic && rest.match(ITALIC_START_MATCH)) {
        this.set(controller, { format: { italic: true } }, 1);
        continue;
      }

      if (this.format.italic && rest.match(ITALIC_END_MATCH)) {
        this.set(controller, { format: { italic: false } }, 1);
        continue;
      }

      const hardLineBreakMatch = rest.match(HARD_LINE_BREAK_MATCH);
      if (hardLineBreakMatch) {
        this.set(
          controller,
          { lineBreak: LineBreak.HARD },
          hardLineBreakMatch[0].length,
        );
        continue;
      }

      const newLineMatch = rest.match(LINE_BREAK_MATCH);
      if (newLineMatch) {
        if (newLineMatch[0].match(ALL_NEW_LINES_MATCH)?.length === 1) {
          this.set(
            controller,
            { lineBreak: LineBreak.SOFT },
            newLineMatch[0].length,
          );
        } else {
          this.set(controller, { node: null }, newLineMatch[0].length);
        }
        continue;
      }

      this.pos += 1;
    }

    const delimiterMatch = this.buffer.match(DELIMITER_MATCH);
    if (!delimiterMatch) {
      this.advance(controller);
    }
  }

  flush(controller: TransformStreamDefaultController<RichTextStreamEvent>) {
    const blockEndMatch = this.buffer.match(BLOCK_END_EOF_MATCH);
    if (blockEndMatch) {
      this.pos = 0;
      this.set(controller, { destination: null }, blockEndMatch[0].length);
    }
    this.advance(controller);
  }
}

export function transformMarkdown() {
  return new TransformStream(new MarkdownTransformer());
}
