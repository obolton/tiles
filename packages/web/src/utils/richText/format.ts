import { Plugin } from "prosemirror-state";
import {
  getSelectionMarks,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
} from "./helpers";
import { schema } from "./schema";

export interface Format {
  h1: boolean;
  h2: boolean;
  h3: boolean;
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
}

export function selectionFormat(callback: (format: Format) => void) {
  return new Plugin({
    view: () => ({
      update: (view, prevState) => {
        const state = view.state;
        if (state.selection === prevState.selection) {
          return;
        }

        const marks = getSelectionMarks(state);
        const headingLevel = getSelectionHeadingLevel(state);
        const blockNodeTypes = getSelectionBlockNodeTypes(state);

        const format = {
          bold: marks.has(schema.marks.bold),
          italic: marks.has(schema.marks.italic),
          underline: marks.has(schema.marks.underline),
          strikethrough: marks.has(schema.marks.strikethrough),
          highlight: marks.has(schema.marks.highlight),
          link: marks.has(schema.marks.link),
          h1: headingLevel === 1,
          h2: headingLevel === 2,
          h3: headingLevel === 3,
          quote: blockNodeTypes.has(schema.nodes.quote),
          orderedList: blockNodeTypes.has(schema.nodes.ordered_list),
          unorderedList: blockNodeTypes.has(schema.nodes.unordered_list),
          checkList: blockNodeTypes.has(schema.nodes.check_list),
        };
        callback(format);
      },
    }),
  });
}
