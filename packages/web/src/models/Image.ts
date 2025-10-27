import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { preloadImage } from "@/utils/media";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientImageTile } from "api/types/tiles";
import type { EditorState } from "prosemirror-state";
import type { AppRouterInputs } from "@/api/client";

export interface ImageOrigin {
  x: number;
  y: number;
}

export default class Image extends Tile {
  readonly type = "IMAGE";

  readonly imageUrl: string | null;
  readonly text: Reactive<ClientImageTile["text"]>;
  readonly origin: Reactive<ImageOrigin>;
  readonly state: Reactive<EditorState | null>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["images"]["create"], "pageId">,
  ) {
    const properties = await client.images.create.mutate({
      pageId: editor.pageId,
      ...data,
    });

    if (properties.imageUrl) {
      await preloadImage(properties.imageUrl);
    }

    editor.addTile(properties);
  }

  constructor(editor: Editor, properties: ClientImageTile) {
    super(editor, properties);

    const { imageUrl, text, originX, originY } = properties;
    this.imageUrl = imageUrl;
    this.text = reactive(text);
    this.origin = reactive({ x: originX, y: originY });
    this.state = reactive(null);
  }

  private update(
    properties: Omit<AppRouterInputs["images"]["update"], "pageId" | "id">,
  ) {
    return client.images.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setOrigin(origin: ImageOrigin) {
    this.origin.value = origin;
    return this.update({ origin });
  }

  persistText() {
    const state = this.state.value;
    const text = state ? serialize(state) : null;
    this.text.value = text;
    return this.update({ text });
  }
}
