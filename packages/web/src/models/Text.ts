import * as Y from "yjs";
import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type Page from "@/models/Page";
import type { ClientTextTile } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly content: Reactive<ClientTextTile["content"]>;
  readonly align: Reactive<ClientTextTile["align"]>;

  static async create(
    page: Page,
    data: Omit<AppRouterInputs["text"]["create"], "pageId">,
  ) {
    const properties = await client.text.create.mutate({
      pageId: page.id,
      ...data,
    });
    const text = new Text(page, properties);
    const { editor } = text;
    editor.addTile(text, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientTextTile) {
    super(page, properties);

    const { content, align } = properties;
    this.content = reactive(content);
    this.align = reactive(align);
  }

  serialize(): ClientTextTile {
    return {
      ...super.serialize(),
      type: "TEXT",
      content: this.content.value,
      align: this.align.value,
    };
  }

  get contentFragment(): Y.XmlFragment {
    if (!this.page.doc) {
      throw new Error("Cannot access content fragment without a Y.Doc");
    }
    return this.page.doc.getXmlFragment(`text:${this.id}`);
  }

  setVerticalAlignment(align: ClientTextTile["align"]) {
    const oldAlign = this.align.value;
    this.align.value = align;
    this.editor.recordOperation({
      apply: {
        type: "text.setProperties",
        data: { tileId: this.id, changes: { align } },
      },
      reverse: {
        type: "text.setProperties",
        data: { tileId: this.id, changes: { align: oldAlign } },
      },
    });
    return client.text.update.mutate({
      pageId: this.page.id,
      id: this.id,
      align,
    });
  }
}
