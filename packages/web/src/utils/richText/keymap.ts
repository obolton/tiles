import { toggleMark } from "prosemirror-commands";
import {
  splitListItem,
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";
import { schema } from "./schema";
import { togglePrompt } from "./commands";

interface Keymap {
  [k: string]: Command;
}

export const keys = {
  "Mod-b": toggleMark(schema.marks.bold),
  "Mod-i": toggleMark(schema.marks.italic),
  "Mod-u": toggleMark(schema.marks.underline),
  "Mod-e": toggleMark(schema.marks.code),
  Enter: splitListItem(schema.nodes.list_item),
  Tab: sinkListItem(schema.nodes.list_item),
  "Shift-Tab": liftListItem(schema.nodes.list_item),
  "Mod-/": togglePrompt,
} satisfies Keymap;
