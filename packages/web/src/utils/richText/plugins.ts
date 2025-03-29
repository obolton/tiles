import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { keys } from "./keymap";
import { lists } from "./lists";
import { createInputRules } from "./inputRules";

export function getPlugins() {
  return [keymap(keys), keymap(baseKeymap), lists(), createInputRules()];
}
