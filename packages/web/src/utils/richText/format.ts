import {
  getSelectionMarks,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  getSelectionAlignment,
  getSelectionLineHeight,
  getSelectionIndent,
  getSelectionList,
  getLink,
} from "./helpers";
import { schema, type TextAlignment } from "./schema";
import type { EditorState } from "prosemirror-state";

export type { TextAlignment };

export type ListType = "unordered" | "ordered" | "check";

export interface Format {
  headingLevel: number | null;
  quote: boolean;
  codeBlock: boolean;
  list: ListType | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight: boolean;
  superscript: boolean;
  subscript: boolean;
  smallCaps: boolean;
  code: boolean;
  link: boolean;
  align?: TextAlignment;
  lineHeight?: number;
  indent?: number;
  pending: boolean;
  size: number;
  color: string | null;
}

export const DEFAULT_FORMAT: Format = {
  headingLevel: null,
  quote: false,
  codeBlock: false,
  list: null,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  highlight: false,
  superscript: false,
  subscript: false,
  smallCaps: false,
  code: false,
  link: false,
  pending: false,
  size: 1,
  color: null,
};

export function getSelectionFormat(state: EditorState): Format {
  const marks = getSelectionMarks(state);
  const headingLevel = getSelectionHeadingLevel(state);
  const blockNodeTypes = getSelectionBlockNodeTypes(state);
  const align = getSelectionAlignment(state);
  const lineHeight = getSelectionLineHeight(state);
  const indent = getSelectionIndent(state);
  const list = getSelectionList(state);
  const link = !!getLink(state);
  const size = schema.marks.size.isInSet(marks)?.attrs.size ?? 1;
  const color = schema.marks.color.isInSet(marks)?.attrs.color ?? null;

  return {
    headingLevel,
    quote: blockNodeTypes.has(schema.nodes.quote),
    codeBlock: blockNodeTypes.has(schema.nodes.codeBlock),
    bold: Boolean(schema.marks.bold.isInSet(marks)),
    italic: Boolean(schema.marks.italic.isInSet(marks)),
    underline: Boolean(schema.marks.underline.isInSet(marks)),
    strikethrough: Boolean(schema.marks.strikethrough.isInSet(marks)),
    highlight: Boolean(schema.marks.highlight.isInSet(marks)),
    superscript: Boolean(schema.marks.superscript.isInSet(marks)),
    subscript: Boolean(schema.marks.subscript.isInSet(marks)),
    smallCaps: Boolean(schema.marks.smallCaps.isInSet(marks)),
    code: Boolean(schema.marks.code.isInSet(marks)),
    link,
    list,
    align,
    lineHeight,
    indent,
    pending: blockNodeTypes.has(schema.nodes.pending),
    size,
    color,
  };
}
