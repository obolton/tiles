import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import Tile from "./Tile";
import { buildTextMap, type TextMapInput } from "doc/tiles/text";
import { type Reactive } from "reactivity";
import { deserialize } from "@/utils/richText/deserialize";
import type Page from "@/models/Page";
import type { VerticalAlignment } from "doc/types/enums";
import type { RichText } from "doc/types/richText";

export interface CreateTextInput extends TextMapInput {
  content?: RichText;
}

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly align: Reactive<VerticalAlignment>;
  readonly contentFragment: Y.XmlFragment;

  static createMap(properties: Omit<CreateTextInput, "parentId" | "beforeId">): Y.Map<unknown> {
    const { content, ...rest } = properties;
    const map = buildTextMap(rest);
    if (content && content.length > 0) {
      prosemirrorToYXmlFragment(deserialize(content), map.get("content") as Y.XmlFragment);
    }
    return map;
  }

  static async create(page: Page, data: CreateTextInput): Promise<Text> {
    const { parentId, beforeId, ...rest } = data;
    const map = Text.createMap(rest);
    const text = page.createTile(map, { parentId, beforeId }) as Text;
    text.editor.addTile(text);
    return text;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.align = this.binding.field("align", "TOP");

    const fragment = map.get("content");
    if (!(fragment instanceof Y.XmlFragment)) {
      throw new Error("Text tile missing content fragment");
    }
    this.contentFragment = fragment;
  }
}
