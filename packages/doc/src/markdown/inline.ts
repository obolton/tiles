import { TextFormat } from "../types/richText";
import type { InlineNode, LinkNode } from "../types/richText";

interface Mark {
  format: TextFormat;
  open: string;
  close: string;
}

/**
 * Marks with a Markdown or HTML rendering, outermost first. HTML tags wrap the delimiters so a
 * delimiter is never squeezed between a word and a tag, where CommonMark would not treat it as
 * emphasis.
 */
const MARKS: Mark[] = [
  { format: TextFormat.HIGHLIGHT, open: "<mark>", close: "</mark>" },
  { format: TextFormat.UNDERLINE, open: "<u>", close: "</u>" },
  { format: TextFormat.SUPERSCRIPT, open: "<sup>", close: "</sup>" },
  { format: TextFormat.SUBSCRIPT, open: "<sub>", close: "</sub>" },
  { format: TextFormat.BOLD, open: "**", close: "**" },
  { format: TextFormat.ITALIC, open: "*", close: "*" },
  { format: TextFormat.STRIKETHROUGH, open: "~~", close: "~~" },
];

const MARK_FORMATS = MARKS.reduce((mask, mark) => mask | mark.format, TextFormat.NONE);

interface Run {
  text: string;
  format: number;
  code: boolean;
  raw: boolean;
}

/** Markdown syntax, an underscore not inside a word, and an ampersand that would start an entity. */
const ESCAPED = /[\\`*[\]<~]|(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])|&(?=[a-zA-Z0-9#]+;)/gu;
/** Block syntax at the start of a line: a quote, heading, list item or thematic break. */
const BLOCK_START = /^(\s*)(>|#(?=[\s#]|$)|-(?=[\s-]|$)|\+(?=\s|$))/;
const ORDERED_START = /^(\s*\d{1,9})([.)])(?=\s|$)/;
const EDGES = /^(\s*)(.*?)(\s*)$/s;

/**
 * Serializes inline nodes to Markdown in one pass, opening and closing marks only where they
 * change. Whitespace at the edge of a run stays outside the delimiters that open or close there,
 * as CommonMark requires, and inside the marks its neighbours share.
 */
export function inlineToMarkdown(nodes: InlineNode[]): string {
  const runs = toRuns(nodes);
  let output = "";
  let open = TextFormat.NONE;
  let lineStart = true;

  const transition = (format: number) => {
    output += transitionMarks(open, format);
    open = format;
  };

  for (const [index, run] of runs.entries()) {
    if (run.raw || run.code) {
      transition(run.format);
      output += run.raw ? run.text : codeSpan(run.text);
      lineStart = false;
      continue;
    }

    const [, lead = "", core = "", trail = ""] = EDGES.exec(run.text) ?? [];
    if (!core) {
      transition(open & nextFormat(runs, index));
      output += run.text;
      continue;
    }

    // Marks that ended with the previous run close before the leading whitespace
    transition(open & run.format);
    output += lead;
    transition(run.format);
    output += escapeText(core, lineStart);
    lineStart = false;
    if (trail) {
      transition(run.format & nextFormat(runs, index));
      output += trail;
    }
  }

  transition(TextFormat.NONE);
  return output;
}

/**
 * Escapes the characters that would otherwise be read as Markdown. `lineStart` also escapes the
 * block syntax that only applies at the start of a line.
 */
export function escapeText(text: string, lineStart = false): string {
  const escaped = text.replace(ESCAPED, "\\$&");
  return lineStart
    ? escaped.replace(BLOCK_START, "$1\\$2").replace(ORDERED_START, "$1\\$2")
    : escaped;
}

/** A code span, fenced with three backticks when the text has a backtick of its own. */
export function codeSpan(text: string): string {
  if (text.length === 0) {
    return "";
  }
  const fence = text.includes("`") ? "```" : "`";
  const padded =
    text.startsWith("`") ||
    text.endsWith("`") ||
    (text.startsWith(" ") && text.endsWith(" ") && text.trim().length > 0);
  const padding = padded ? " " : "";
  return `${fence}${padding}${text}${padding}${fence}`;
}

/**
 * The delimiters that take the open marks to the target. Marks nest in {@link MARKS} order, so
 * everything from the first mark that differs closes and reopens as needed.
 */
function transitionMarks(open: number, target: number): string {
  const changed = MARKS.findIndex((mark) => (open & mark.format) !== (target & mark.format));
  if (changed === -1) {
    return "";
  }
  let closing = "";
  let opening = "";
  for (const mark of MARKS.slice(changed)) {
    if (open & mark.format) {
      closing = mark.close + closing;
    }
    if (target & mark.format) {
      opening += mark.open;
    }
  }
  return closing + opening;
}

/** The marks of the next run with content, which whitespace before it may stay inside. */
function nextFormat(runs: Run[], index: number): number {
  for (const run of runs.slice(index + 1)) {
    if (run.raw || run.code || run.text.trim().length > 0) {
      return run.format;
    }
  }
  return TextFormat.NONE;
}

function toRuns(nodes: InlineNode[]): Run[] {
  const runs: Run[] = [];
  const push = (run: Run) => {
    const last = runs.at(-1);
    if (last && !last.raw && !run.raw && last.format === run.format && last.code === run.code) {
      last.text += run.text;
    } else {
      runs.push(run);
    }
  };

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        if (!node.pending) {
          push(textRun(node.text, node.format));
        }
        break;
      case "date":
      case "dropdown":
        push(textRun(node.value, node.format));
        break;
      case "mention":
        push(textRun(`@${node.displayName}`, node.format));
        break;
      case "link":
        push({ text: renderLink(node), format: TextFormat.NONE, code: false, raw: true });
        break;
    }
  }
  return runs;
}

function textRun(text: string, format: number): Run {
  return {
    text,
    format: format & MARK_FORMATS,
    code: (format & TextFormat.CODE) !== 0,
    raw: false,
  };
}

function renderLink(node: LinkNode): string {
  const text = inlineToMarkdown(node.children) || escapeText(node.href);
  return `[${text}](${destination(node.href)})`;
}

/** A link destination: in angle brackets when it has whitespace, else with parentheses escaped. */
function destination(href: string): string {
  if (/\s/.test(href)) {
    return `<${href.replace(/[<>]/g, encodeURIComponent)}>`;
  }
  return href.replace(/[()]/g, "\\$&");
}
