import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
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
    editor.addTile(text, properties.sectionId, data.afterId);
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

  setVerticalAlignment(align: ClientTextTile["align"]) {
    this.align.value = align;
    return this.update({ align });
  }

  persist() {
    const state = this.state.value;
    if (!state) {
      return;
    }
    const content = serialize(state);
    this.content.value = content;
    return this.update({ content });
  }
}
