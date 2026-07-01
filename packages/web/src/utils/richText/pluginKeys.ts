import { PluginKey } from "prosemirror-state";
import type { DecorationSet } from "prosemirror-view";

export const PROMPT_PLUGIN_KEY = new PluginKey<DecorationSet | null>("prompt-plugin");
