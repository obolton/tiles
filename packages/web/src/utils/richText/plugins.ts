import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { keys } from "./keymap";
import { lists } from "./lists";
import { createInputRules } from "./inputRules";
import { placeholders } from "./placeholders";
import { dates } from "./dates";
import { links } from "./links";
import { headings } from "./headings";
import type { Plugin } from "prosemirror-state";

export function getPlugins(): Plugin[] {
  return [
    keymap(keys),
    keymap(baseKeymap),
    lists(),
    createInputRules(),
    placeholders(),
    dates(),
    links(),
    headings(),
  ];
}
