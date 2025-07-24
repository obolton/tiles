import { toggleMark, wrapIn, lift } from "prosemirror-commands";
import { liftListItem, wrapRangeInList } from "prosemirror-schema-list";
import { schema, type TextAlignment } from "./schema";
import {
  closest,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
  getMarkRange,
  findMark,
} from "./helpers";
import type { NodeType } from "prosemirror-model";
import type { Command } from "prosemirror-state";

export const toggleBold = toggleMark(schema.marks.bold);

export const toggleItalic = toggleMark(schema.marks.italic);

export const toggleUnderline = toggleMark(schema.marks.underline);

export const toggleStrikethrough = toggleMark(schema.marks.strikethrough);

export const toggleHighlight = toggleMark(schema.marks.highlight);

export function addLink(href: string): Command {
  return function (state, dispatch) {
    if (!href) {
      return false;
    }

    const { from, to, empty } = state.selection;
    if (empty) {
      return false;
    }

    if (dispatch) {
      const content = state.doc.slice(from, to).content;
      const link = schema.nodes.link.create({ href }, content);
      const tr = state.tr.replaceWith(from, to, link);
      dispatch(tr);
    }

    return true;
  };
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
      const tr = state.tr;
      const selection = tr.selection;
      for (const range of selection.ranges) {
        tr.setBlockType(
          range.$from.pos,
          range.$to.pos,
          schema.nodes.paragraph,
          (oldNode) => ({
            align: oldNode.attrs.align as TextAlignment | undefined,
          }),
        );
      }
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    } else {
      if (!view) {
        return false;
      }
      liftListItem(schema.nodes.list_item)(state, dispatch, view);
      const tr = view.state.tr;
      const selection = tr.selection;
      for (const range of selection.ranges) {
        tr.setBlockType(
          range.$from.pos,
          range.$to.pos,
          schema.nodes.heading,
          (oldNode) => ({
            ...oldNode.attrs,
            level,
          }),
        );
      }
      if (dispatch) {
        dispatch(tr);
      }
      return true;
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
        dispatch?.(state.tr.setNodeMarkup(list.pos, nodeType));
        return true;
      }
    } else {
      const tr = state.tr;
      tr.setBlockType(
        tr.selection.from,
        tr.selection.to,
        schema.nodes.paragraph,
        null,
      );
      const range = tr.selection.$from.blockRange(tr.selection.$to);
      if (!range) {
        return false;
      }
      const canWrap = wrapRangeInList(
        dispatch ? tr : null,
        range,
        nodeType,
        null,
      );
      if (!canWrap) {
        return false;
      }
      dispatch?.(tr);
      return true;
    }
  };
}

export const toggleOrderedList = toggleList(schema.nodes.ordered_list);

export const toggleUnorderedList = toggleList(schema.nodes.unordered_list);

export const toggleCheckList = toggleList(schema.nodes.check_list);

export const removeLink: Command = (state, dispatch) => {
  const link = closest(
    state.selection.$from,
    (node) => node.type === schema.nodes.link,
  );

  if (!link) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    const { pos, node } = link;
    tr.replaceWith(pos, pos + node.nodeSize, node.content);
    dispatch(tr);
  }

  return true;
};

export function setAlignment(align: TextAlignment): Command {
  return function (state, dispatch) {
    const { selection, tr } = state;

    if (selection.empty) {
      const node = closest(selection.$from, (node) => node.isTextblock);
      if (!node) {
        return false;
      }

      if (dispatch) {
        dispatch(tr.setNodeAttribute(node.pos, "align", align));
      }

      return true;
    }

    if (dispatch) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.isTextblock) {
          tr.setNodeAttribute(pos, "align", align);
        }
      });

      dispatch(tr);
    }

    return true;
  };
}

export function insertDateTime(value: Date, time?: boolean): Command {
  return function (state, dispatch) {
    if (dispatch) {
      dispatch(
        state.tr.replaceSelectionWith(
          schema.nodes.date.create({ value, time }),
        ),
      );
    }
    return true;
  };
}

export function approve(): Command {
  return function (state, dispatch) {
    const { selection } = state;
    const range = selection.empty
      ? getMarkRange(state, selection.from, schema.marks.pending)
      : { from: selection.from, to: selection.to };

    if (!range) {
      return false;
    }

    if (dispatch) {
      const { from, to } = range;
      const tr = state.tr.removeMark(from, to, schema.marks.pending);
      dispatch(tr);
    }

    return true;
  };
}

export function reject(): Command {
  return function (state, dispatch) {
    const { selection } = state;
    const tr = state.tr;

    if (selection.empty) {
      const range = getMarkRange(state, selection.from, schema.marks.pending);
      if (!range) {
        return false;
      }
      tr.deleteRange(range.from, range.to);
    } else {
      const ranges: { from: number; to: number }[] = [];
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (findMark(node, schema.marks.pending)) {
          ranges.push({ from: pos, to: pos + node.nodeSize });
        }
      });
      if (ranges.length === 0) {
        return false;
      }
      for (const range of ranges.reverse()) {
        tr.deleteRange(range.from, range.to);
      }
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}
