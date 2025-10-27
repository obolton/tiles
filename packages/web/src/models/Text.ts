import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientTextTile } from "api/types/tiles";
import type { EditorState } from "prosemirror-state";
import type { Color } from "@/utils/color";
import type {
  Background,
  BackgroundUpdate,
} from "@/components/backgrounds/types";
import type { AppRouterInputs } from "@/api/client";

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly content: Reactive<ClientTextTile["content"]>;
  readonly align: Reactive<ClientTextTile["align"]>;
  readonly textColor: Reactive<Color | null>;
  readonly background: Reactive<Background | null>;
  readonly state: Reactive<EditorState | null>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["text"]["create"], "pageId">,
  ) {
    const properties = await client.text.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    editor.addTile(properties);
  }

  constructor(editor: Editor, properties: ClientTextTile) {
    super(editor, properties);

    const { content, align, textColor, background } = properties;
    this.content = reactive(content);
    this.align = reactive(align);
    this.textColor = reactive(textColor);
    this.background = reactive(background);
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

  setTextColor(textColor: Color | null) {
    this.textColor.value = textColor;
    return this.update({ textColor });
  }

  async setBackground(background: BackgroundUpdate) {
    const result = await this.update({ background });
    this.background.value = result.background;
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
