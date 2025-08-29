import {
  getSelectionMarks,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  getSelectionAlignment,
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
  list: ListType | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight: boolean;
  link: boolean;
  align?: TextAlignment;
  pending: boolean;
}

export const DEFAULT_FORMAT = {
  headingLevel: null,
  quote: false,
  list: null,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  highlight: false,
  link: false,
  pending: false,
};

export function getSelectionFormat(state: EditorState): Format {
  const marks = getSelectionMarks(state);
  const headingLevel = getSelectionHeadingLevel(state);
  const blockNodeTypes = getSelectionBlockNodeTypes(state);
  const align = getSelectionAlignment(state);
  const list = getSelectionList(state);
  const link = !!getLink(state);

  return {
    bold: marks.has(schema.marks.bold),
    italic: marks.has(schema.marks.italic),
    underline: marks.has(schema.marks.underline),
    strikethrough: marks.has(schema.marks.strikethrough),
    highlight: marks.has(schema.marks.highlight),
    link,
    headingLevel,
    quote: blockNodeTypes.has(schema.nodes.quote),
    list,
    align,
    pending: blockNodeTypes.has(schema.nodes.pending),
  };
}
