import { toggleMark, wrapIn, lift } from "prosemirror-commands";
import { liftListItem, wrapRangeInList } from "prosemirror-schema-list";
import { schema, type TextAlignment } from "./schema";
import {
  closest,
  getSelectionHeadingLevel,
  getSelectionBlockNodeTypes,
} from "./helpers";
import { MAX_INDENT } from "@/constants/formatting";
import { PROMPT_PLUGIN_KEY } from "./pluginKeys";
import { MENTION_PLUGIN_KEY, type MentionMeta } from "./mentions";
import type { PromptMeta } from "./prompt";
import type { NodeType, Mark, MarkType } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { FontId } from "api/config/fonts";

export function addMark(mark: Mark): Command {
  return function (state, dispatch) {
    if (dispatch) {
      const { empty, from, to } = state.selection;
      if (empty) {
        dispatch(state.tr.addStoredMark(mark));
      } else {
        dispatch(state.tr.addMark(from, to, mark));
      }
    }
    return true;
  };
}

export function removeMark(mark: Mark | MarkType): Command {
  return function (state, dispatch) {
    if (dispatch) {
      const { tr, storedMarks, selection } = state;

      if (storedMarks && mark.isInSet(storedMarks)) {
        tr.removeStoredMark(mark);
      }
      tr.removeMark(selection.from, selection.to, mark);

      dispatch(tr);
    }
    return true;
  };
}

export function setTextSize(size: number) {
  return addMark(schema.marks.size.create({ size }));
}

export function setTextColor(color: string) {
  return addMark(schema.marks.color.create({ color }));
}

export const removeTextColor = removeMark(schema.marks.color);

export function setFont(font: FontId) {
  return addMark(schema.marks.font.create({ font }));
}

export const toggleBold = toggleMark(schema.marks.bold);

export const toggleItalic = toggleMark(schema.marks.italic);

export const toggleUnderline = toggleMark(schema.marks.underline);

export const toggleStrikethrough = toggleMark(schema.marks.strikethrough);

export const toggleHighlight = toggleMark(schema.marks.highlight);

export const toggleSuperscript = toggleMark(schema.marks.superscript);

export const toggleSubscript = toggleMark(schema.marks.subscript);

export const toggleSmallCaps = toggleMark(schema.marks.smallCaps);

export const toggleInlineCode = toggleMark(schema.marks.code);

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

export const toggleCode: Command = (state, dispatch) => {
  if (dispatch) {
    const tr = state.tr;
    for (const range of tr.selection.ranges) {
      tr.setBlockType(range.$from.pos, range.$to.pos, schema.nodes.codeBlock);
    }
    dispatch(tr);
  }

  return true;
};

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
            lineHeight: oldNode.attrs.lineHeight as number | undefined,
            indent: oldNode.attrs.indent as number | undefined,
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

export const resetBlockFormat: Command = (state, dispatch) => {
  const tr = state.tr;
  const selection = tr.selection;
  for (const range of selection.ranges) {
    tr.setBlockType(
      range.$from.pos,
      range.$to.pos,
      schema.nodes.paragraph,
      (oldNode) => ({
        align: oldNode.attrs.align as TextAlignment | undefined,
        lineHeight: oldNode.attrs.lineHeight as number | undefined,
      }),
    );
  }
  if (dispatch) {
    dispatch(tr);
  }
  return true;
};

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

export function unwrap(nodeType: NodeType): Command {
  return function (state, dispatch) {
    const resolved = closest(
      state.selection.$from,
      (node) => node.type === nodeType,
    );

    if (!resolved) {
      return false;
    }

    if (dispatch) {
      const { pos, node } = resolved;
      const tr = state.tr.replaceWith(pos, pos + node.nodeSize, node.content);
      dispatch(tr);
    }

    return true;
  };
}

export function deleteNode(nodeType: NodeType): Command {
  return function (state, dispatch) {
    const resolved = closest(
      state.selection.$from,
      (node) => node.type === nodeType,
    );

    if (!resolved) {
      return false;
    }

    if (dispatch) {
      const { pos, node } = resolved;
      const tr = state.tr.delete(pos, pos + node.nodeSize);
      dispatch(tr);
    }

    return true;
  };
}

export const removeLink = unwrap(schema.nodes.link);

export function setLineHeight(lineHeight: number | undefined): Command {
  return function (state, dispatch) {
    const { selection, tr } = state;

    if (selection.empty) {
      const node = closest(selection.$from, (node) => node.isTextblock);
      if (!node) {
        return false;
      }

      if (dispatch) {
        dispatch(tr.setNodeAttribute(node.pos, "lineHeight", lineHeight));
      }

      return true;
    }

    if (dispatch) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.isTextblock) {
          tr.setNodeAttribute(pos, "lineHeight", lineHeight);
        }
      });

      dispatch(tr);
    }

    return true;
  };
}

export function adjustIndent(delta: number): Command {
  return function (state, dispatch) {
    if (dispatch) {
      const { selection, tr } = state;
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.isTextblock) {
          const current = (node.attrs.indent as number | undefined) ?? 0;
          const next = Math.min(Math.max(current + delta, 0), MAX_INDENT);
          if (next !== current) {
            tr.setNodeAttribute(pos, "indent", next || undefined);
          }
        }
      });
      dispatch(tr);
    }
    return true;
  };
}

export const indent = adjustIndent(1);

export const outdent = adjustIndent(-1);

export function setCodeBlockLanguage(language: string): Command {
  return function (state, dispatch) {
    const codeBlock = closest(
      state.selection.$from,
      (node) => node.type === schema.nodes.codeBlock,
    );
    if (!codeBlock) {
      return false;
    }
    if (dispatch) {
      dispatch(state.tr.setNodeAttribute(codeBlock.pos, "language", language));
    }
    return true;
  };
}

export const toggleCodeBlockLineNumbers: Command = (state, dispatch) => {
  const codeBlock = closest(
    state.selection.$from,
    (node) => node.type === schema.nodes.codeBlock,
  );
  if (!codeBlock) {
    return false;
  }
  if (dispatch) {
    dispatch(
      state.tr.setNodeAttribute(
        codeBlock.pos,
        "lineNumbers",
        !codeBlock.node.attrs.lineNumbers,
      ),
    );
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

export function insertDropdown(dropdownType: string, value: string): Command {
  return function (state, dispatch) {
    if (dispatch) {
      dispatch(
        state.tr.replaceSelectionWith(
          schema.nodes.dropdown.create({ dropdownType, value }),
        ),
      );
    }
    return true;
  };
}

export function insertMention(userId: string, displayName: string): Command {
  return function (state, dispatch) {
    if (dispatch) {
      dispatch(
        state.tr.replaceSelectionWith(
          schema.nodes.mention.create({ userId, displayName }),
        ),
      );
    }
    return true;
  };
}

export const insertDivider: Command = (state, dispatch) => {
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(schema.nodes.divider.create(null)));
  }
  return true;
};

export const approve = unwrap(schema.nodes.pending);

export const reject = deleteNode(schema.nodes.pending);

export const togglePrompt: Command = (state, dispatch, view) => {
  if (dispatch) {
    const pos = state.selection.to;
    const isOpen = !!PROMPT_PLUGIN_KEY.getState(state);
    const tr = state.tr.setMeta(PROMPT_PLUGIN_KEY, {
      pos: isOpen ? null : pos,
    } as PromptMeta);
    dispatch(tr);

    // Restore focus to the editor
    if (isOpen) {
      view?.focus();
    }
  }
  return true;
};

export const openMentionPicker: Command = (state, dispatch) => {
  if (dispatch) {
    const { from } = state.selection;
    dispatch(
      state.tr.setMeta(MENTION_PLUGIN_KEY, { pos: from } as MentionMeta),
    );
  }
  return true;
};
