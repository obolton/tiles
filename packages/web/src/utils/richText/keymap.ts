import { toggleMark } from "prosemirror-commands";
import {
  splitListItem,
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";
import { schema } from "./schema";
import { togglePrompt, indent, outdent } from "./commands";
import { isInList } from "./helpers";

interface Keymap {
  [k: string]: Command;
}

export const keys = {
  "Mod-b": toggleMark(schema.marks.bold),
  "Mod-i": toggleMark(schema.marks.italic),
  "Mod-u": toggleMark(schema.marks.underline),
  "Mod-e": toggleMark(schema.marks.code),
  Enter: splitListItem(schema.nodes.list_item),
  Tab(state, dispatch, view) {
    if (isInList(state)) {
      return sinkListItem(schema.nodes.list_item)(state, dispatch, view);
    }
    return indent(state, dispatch, view);
  },
  "Shift-Tab"(state, dispatch, view) {
    if (isInList(state)) {
      return liftListItem(schema.nodes.list_item)(state, dispatch, view);
    }
    return outdent(state, dispatch, view);
  },
  "Mod-/": togglePrompt,
} satisfies Keymap;
