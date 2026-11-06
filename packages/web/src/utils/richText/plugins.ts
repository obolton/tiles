import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { gapCursor } from "prosemirror-gapcursor";
import { keys } from "./keymap";
import { lists } from "./lists";
import { createInputRules } from "./inputRules";
import { placeholders } from "./placeholders";
import { dates } from "./dates";
import { links } from "./links";
import { headings } from "./headings";
import { prompt } from "./prompt";
import { dropdowns } from "./dropdowns";
import { mentions } from "./mentions";
import { code } from "./code/code";
import { tiles, type TilesOptions } from "./tiles/tiles";
import type { Plugin } from "prosemirror-state";

export type PluginOptions = TilesOptions;

export function getPlugins(options: PluginOptions = {}): Plugin[] {
  return [
    keymap(keys),
    keymap(baseKeymap),
    gapCursor(),
    lists(),
    createInputRules(),
    placeholders(),
    dates(),
    links(),
    headings(),
    prompt(),
    dropdowns(),
    mentions(),
    code(),
    tiles(options),
  ];
}
