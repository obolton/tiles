import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientTextTile } from "api/src/types/tiles";
import type { EditorState } from "prosemirror-state";
import type { Color } from "@/utils/color";
import type { Background } from "@/components/backgrounds/types";
import type { AppRouterInputs } from "@/api/client";

export default class Text extends Tile {
  readonly type = "TEXT";

  readonly content: Reactive<ClientTextTile["content"]>;
  readonly align: Reactive<ClientTextTile["align"]>;
  readonly textColor: Reactive<Color | null>;
  readonly background: Reactive<ClientTextTile["background"]>;
  readonly state: Reactive<EditorState | null>;

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

  setBackground(background: Background | null) {
    this.background.value = background;
    return this.update({ background });
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
