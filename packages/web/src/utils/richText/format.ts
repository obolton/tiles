import { Plugin } from "prosemirror-state";
import {
  getSelectionMarks,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  getSelectionAlignment,
} from "./helpers";
import { schema, type TextAlignment } from "./schema";

export type { TextAlignment };

export interface Format {
  headingLevel: number | null;
  quote: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  checkList: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight: boolean;
  link: boolean;
  align?: TextAlignment;
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

        const format = {
          bold: marks.has(schema.marks.bold),
          italic: marks.has(schema.marks.italic),
          underline: marks.has(schema.marks.underline),
          strikethrough: marks.has(schema.marks.strikethrough),
          highlight: marks.has(schema.marks.highlight),
          link: marks.has(schema.marks.link),
          headingLevel,
          quote: blockNodeTypes.has(schema.nodes.quote),
          orderedList: blockNodeTypes.has(schema.nodes.ordered_list),
          unorderedList: blockNodeTypes.has(schema.nodes.unordered_list),
          checkList: blockNodeTypes.has(schema.nodes.check_list),
          align,
        };
        callback(format);
      },
    }),
  });
}
