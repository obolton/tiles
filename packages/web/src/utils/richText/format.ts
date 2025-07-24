import { Plugin } from "prosemirror-state";
import {
  getSelectionMarks,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  getSelectionAlignment,
  getSelectionList,
  getLink,
} from "./helpers";
import { schema, type TextAlignment } from "./schema";

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

export function selectionFormat(callback: (format: Format) => void) {
  return new Plugin({
    view: () => ({
      update: (view, prevState) => {
        const state = view.state;
        if (
          state.selection === prevState.selection &&
          state.storedMarks === prevState.storedMarks
        ) {
          return;
        }

        const marks = getSelectionMarks(state);
        const headingLevel = getSelectionHeadingLevel(state);
        const blockNodeTypes = getSelectionBlockNodeTypes(state);
        const align = getSelectionAlignment(state);
        const list = getSelectionList(state);
        const link = !!getLink(state);

        const format = {
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
          pending: marks.has(schema.marks.pending),
        };
        callback(format);
      },
    }),
  });
}
