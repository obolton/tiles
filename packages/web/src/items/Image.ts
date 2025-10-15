import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import { serialize } from "@/utils/richText/serialize";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientImageTile } from "@/types/tiles";
import type { EditorState } from "prosemirror-state";
import type { AppRouterInputs } from "@/api/client";

export interface ImageOrigin {
  x: number;
  y: number;
}

export default class Image extends Tile {
  readonly type = "IMAGE";

  readonly imageUrl: Reactive<string>;
  readonly text: Reactive<ClientImageTile["text"]>;
  readonly origin: Reactive<ImageOrigin>;
  readonly state: Reactive<EditorState | null>;

  constructor(editor: Editor, properties: ClientImageTile) {
    super(editor, properties);

    const { imageUrl, text, originX, originY } = properties;
    this.imageUrl = reactive(imageUrl);
    this.text = reactive(text);
    this.origin = reactive({ x: originX, y: originY });
    this.state = reactive(null);
  }

  private update(
    properties: Omit<AppRouterInputs["images"]["update"], "pageId" | "id">,
  ) {
    client.images.update
      .mutate({
        ...properties,
        pageId: this.editor.pageId,
        id: this.id,
      })
      .catch(handleError);
  }

  setOrigin(origin: ImageOrigin) {
    this.origin.value = origin;
    this.update({ origin });
  }

  persistText() {
    const state = this.state.value;
    const text = state ? serialize(state) : null;
    this.text.value = text;
    this.update({ text });
  }
}
