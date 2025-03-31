import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import { liftListItem, wrapInList } from "prosemirror-schema-list";
import type { NodeType } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import { schema, type TextAlignment } from "./schema";
import {
  closest,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  findLinkRange,
} from "./helpers";

export const toggleBold = toggleMark(schema.marks.bold);

export const toggleItalic = toggleMark(schema.marks.italic);

export const toggleUnderline = toggleMark(schema.marks.underline);

export const toggleStrikethrough = toggleMark(schema.marks.strikethrough);

export const toggleHighlight = toggleMark(schema.marks.highlight);

export function toggleLink(href: string | null): Command {
  return toggleMark(schema.marks.link, { href });
}

export function toggleWrap(nodeType: NodeType): Command {
  return function (state, dispatch, view) {
    if (getSelectionBlockNodeTypes(state).has(nodeType)) {
      return lift(state, dispatch, view);
    }
    return wrapIn(nodeType)(state, dispatch, view);
  };
}

export const toggleQuote = toggleWrap(schema.nodes.quote);

export function toggleHeading(level: 1 | 2 | 3): Command {
  return function (state, dispatch, view) {
    if (getSelectionHeadingLevel(state) === level) {
      return setBlockType(schema.nodes.paragraph, {
        level,
      })(state, dispatch, view);
    } else {
      return setBlockType(schema.nodes.heading, {
        level,
      })(state, dispatch, view);
    }
  };
}

const listNodeTypes = new Set([
  schema.nodes.ordered_list,
  schema.nodes.unordered_list,
  schema.nodes.check_list,
]);

export function toggleList(nodeType: NodeType): Command {
  return function (state, dispatch, view) {
    const { selection } = state;
    const list = closest(selection.$from, (node) =>
      listNodeTypes.has(node.type),
    );
    if (list) {
      if (list.node.type === nodeType) {
        return liftListItem(schema.nodes.list_item)(state, dispatch, view);
      } else {
        if (dispatch) {
          dispatch(state.tr.setNodeMarkup(list.pos, nodeType));
        }
        return true;
      }
    } else {
      return wrapInList(nodeType)(state, dispatch, view);
    }
  };
}

export const toggleOrderedList = toggleList(schema.nodes.ordered_list);

export const toggleUnorderedList = toggleList(schema.nodes.unordered_list);

export const toggleCheckList = toggleList(schema.nodes.check_list);

export const removeLink: Command = (state, dispatch) => {
  const range = findLinkRange(state.selection.$from);
  if (range) {
    if (dispatch) {
      dispatch(state.tr.removeMark(range.from, range.to, schema.marks.link));
    }
    return true;
  }
  return false;
};

export function setAlignment(align: TextAlignment): Command {
  return function (state, dispatch) {
    const node = closest(state.selection.$from, (node) => node.isTextblock);
    if (!node) {
      return false;
    }
    if (dispatch) {
      dispatch(state.tr.setNodeAttribute(node.pos, "align", align));
    }
    return true;
  };
}
