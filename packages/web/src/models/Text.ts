import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { createState } from "@/utils/richText/state";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientTextTile } from "api/types/tiles";
import type { EditorState } from "prosemirror-state";
import type { AppRouterInputs } from "@/api/client";

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly content: Reactive<ClientTextTile["content"]>;
  readonly align: Reactive<ClientTextTile["align"]>;
  readonly state: Reactive<EditorState | null>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["text"]["create"], "pageId">,
  ) {
    const properties = await client.text.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    const text = new Text(editor, properties);
    editor.addTile(text, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(editor: Editor, properties: ClientTextTile) {
    super(editor, properties);

    const { content, align } = properties;
    this.content = reactive(content);
    this.align = reactive(align);
    this.state = reactive(null);
  }

  private update(
    properties: Omit<AppRouterInputs["text"]["update"], "pageId" | "id">,
  ) {
    return client.text.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  getEditorState() {
    if (!this.state.value) {
      this.state.value = createState(this.content.value);
    }
    return this.state;
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
    return this.update({ align });
  }

  persist() {
    const state = this.state.value;
    if (!state) {
      return;
    }
    const oldContent = this.content.value;
    const content = serialize(state);
    this.content.value = content;
    this.editor.recordOperation({
      apply: {
        type: "text.setProperties",
        data: { tileId: this.id, changes: { content } },
      },
      reverse: {
        type: "text.setProperties",
        data: { tileId: this.id, changes: { content: oldContent } },
      },
    });
    return this.update({ content });
  }
}
