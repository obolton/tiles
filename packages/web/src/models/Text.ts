import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import Tile, { type CreateTileInput } from "./Tile";
import { type Reactive } from "@/utils/reactivity";
import { deserialize } from "@/utils/richText/deserialize";
import type Page from "@/models/Page";
import type { ClientTextTile } from "api/types/tiles";
import type { RichText } from "@/utils/richText/types";

export interface CreateTextInput extends Omit<CreateTileInput, "type"> {
  align?: ClientTextTile["align"];
  content?: RichText;
}

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly align: Reactive<ClientTextTile["align"]>;
  readonly contentFragment: Y.XmlFragment;

  static createMap(
    properties: Omit<CreateTextInput, "parentId" | "beforeId">,
  ): Y.Map<unknown> {
    const { content, align, ...baseProps } = properties;
    const map = super.buildBaseMap({ ...baseProps, type: "TEXT" });
    map.set("align", align ?? "TOP");

    const fragment = new Y.XmlFragment();
    if (content && content.length > 0) {
      prosemirrorToYXmlFragment(deserialize(content), fragment);
    }
    map.set("content", fragment);

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

  serialize(): ClientTextTile {
    return {
      ...super.serialize(),
      type: "TEXT",
      content: [],
      align: this.align.value,
    };
  }

}
