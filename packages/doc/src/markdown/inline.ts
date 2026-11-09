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
  /** The subset of {@link MARK_FORMATS} applied to the text. */
  format: number;
  /** Rendered as a code span, verbatim. */
  code: boolean;
  /** Already rendered Markdown, emitted as is. */
  raw: boolean;
}

const ESCAPED = /[\\`*[\]<~_]/g;
const ENTITY = /&(?=[a-zA-Z0-9#]+;)/g;
const ALPHANUMERIC = /[\p{L}\p{N}]/u;

/** Block syntax at the start of a line: a quote, heading, list item or thematic break. */
const BLOCK_START = /^(\s*)(>|#(?=[\s#]|$)|-(?=[\s-]|$)|\+(?=\s|$))/;
const ORDERED_START = /^(\s*\d{1,9})([.)])(?=\s|$)/;

/**
 * Serializes inline nodes to Markdown, opening and closing marks only where they change and
 * keeping whitespace outside of delimiters.
 */
export function inlineToMarkdown(nodes: InlineNode[]): string {
  let output = "";
  let open: Mark[] = [];

  for (const run of mergeRuns(shareWhitespace(splitWhitespace(toRuns(nodes))))) {
    const wanted = MARKS.filter((mark) => run.format & mark.format);
    let shared = 0;
    while (shared < open.length && open[shared] === wanted[shared]) {
      shared++;
    }
    output += closing(open.slice(shared)) + opening(wanted.slice(shared));
    open = wanted;

    if (run.raw) {
      output += run.text;
    } else if (run.code) {
      output += codeSpan(run.text);
    } else {
      output += escapeText(run.text, output.trim().length === 0);
    }
  }

  return output + closing(open);
}

/**
 * Escapes the characters that would otherwise be read as Markdown. `lineStart` also escapes the
 * block syntax that only applies at the start of a line.
 */
export function escapeText(text: string, lineStart = false): string {
  const escaped = text
    .replace(ESCAPED, (char, offset: number, source: string) =>
      char === "_" && isWordInternal(source, offset) ? char : `\\${char}`,
    )
    .replace(ENTITY, "\\&");
  return lineStart
    ? escaped.replace(BLOCK_START, "$1\\$2").replace(ORDERED_START, "$1\\$2")
    : escaped;
}

/** A code span fenced with more backticks than any run inside it. */
export function codeSpan(text: string): string {
  if (text.length === 0) {
    return "";
  }
  const fence = "`".repeat(longestRun(text, "`") + 1);
  const padded =
    text.startsWith("`") ||
    text.endsWith("`") ||
    (text.startsWith(" ") && text.endsWith(" ") && text.trim().length > 0);
  const padding = padded ? " " : "";
  return `${fence}${padding}${text}${padding}${fence}`;
}

/** The length of the longest consecutive run of `char` in the text. */
export function longestRun(text: string, char: string): number {
  let longest = 0;
  let current = 0;
  for (const character of text) {
    current = character === char ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

function opening(marks: Mark[]): string {
  return marks.map((mark) => mark.open).join("");
}

function closing(marks: Mark[]): string {
  return marks
    .map((mark) => mark.close)
    .toReversed()
    .join("");
}

function toRuns(nodes: InlineNode[]): Run[] {
  const runs: Run[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        if (!node.pending) {
          runs.push(textRun(node.text, node.format));
        }
        break;
      case "date":
      case "dropdown":
        runs.push(textRun(node.value, node.format));
        break;
      case "mention":
        runs.push(textRun(`@${node.displayName}`, node.format));
        break;
      case "link":
        runs.push({ text: renderLink(node), format: TextFormat.NONE, code: false, raw: true });
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

/** Splits the whitespace at the edges of each marked run into runs of its own. */
function splitWhitespace(runs: Run[]): Run[] {
  return runs.flatMap((run) => {
    const match = run.code || run.raw ? null : /^(\s*)(.*?)(\s*)$/s.exec(run.text);
    if (!match) {
      return [run];
    }
    return match.slice(1).flatMap((part) => (part ? [{ ...run, text: part }] : []));
  });
}

/**
 * Gives each whitespace-only run the marks its neighbours share, so whitespace between two runs
 * of a span stays inside it while whitespace at the edges of a span falls outside the delimiters.
 */
function shareWhitespace(runs: Run[]): Run[] {
  return runs.map((run, index) => {
    if (isContent(run)) {
      return run;
    }
    const before = runs.slice(0, index).findLast(isContent);
    const after = runs.slice(index + 1).find(isContent);
    return { ...run, format: (before?.format ?? 0) & (after?.format ?? 0) };
  });
}

function isContent(run: Run): boolean {
  return run.code || run.raw || run.text.trim().length > 0;
}

function mergeRuns(runs: Run[]): Run[] {
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged.at(-1);
    if (last && !last.raw && !run.raw && last.format === run.format && last.code === run.code) {
      last.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
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

function isWordInternal(text: string, offset: number): boolean {
  const before = text[offset - 1];
  const after = text[offset + 1];
  return (
    before !== undefined &&
    after !== undefined &&
    ALPHANUMERIC.test(before) &&
    ALPHANUMERIC.test(after)
  );
}
