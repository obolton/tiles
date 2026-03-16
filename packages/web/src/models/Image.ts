import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { preloadImage } from "@/utils/media";
import client from "@/api/client";
import type Page from "@/models/Page";
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
    page: Page,
    data: Omit<AppRouterInputs["images"]["create"], "pageId">,
  ) {
    const properties = await client.images.create.mutate({
      pageId: page.id,
      ...data,
    });

    if (properties.imageUrl) {
      await preloadImage(properties.imageUrl);
    }

    const image = new Image(page, properties);
    const { editor } = image;
    editor.addTile(image, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientImageTile) {
    super(page, properties);

    const { imageUrl, alt, text, originX, originY } = properties;
    this.imageUrl = imageUrl;
    this.alt = reactive(alt);
    this.text = reactive(text);
    this.origin = reactive({ x: originX, y: originY });
    this.state = reactive(null);
  }

  serialize(): ClientImageTile {
    return {
      ...super.serialize(),
      type: "IMAGE",
      imageUrl: this.imageUrl,
      alt: this.alt.value,
      originX: this.origin.value.x,
      originY: this.origin.value.y,
      text: this.text.value,
    };
  }

  private update(
    properties: Omit<AppRouterInputs["images"]["update"], "pageId" | "id">,
  ) {
    return client.images.update.mutate({
      ...properties,
      pageId: this.page.id,
      id: this.id,
    });
  }

  setAlt(alt: string | null) {
    const oldAlt = this.alt.value;
    this.alt.value = alt;
    this.editor.recordOperation({
      apply: {
        type: "image.setProperties",
        data: { tileId: this.id, changes: { alt } },
      },
      reverse: {
        type: "image.setProperties",
        data: { tileId: this.id, changes: { alt: oldAlt } },
      },
    });
    return this.update({ alt });
  }

  setOrigin(origin: ImageOrigin) {
    const oldOrigin = this.origin.value;
    this.origin.value = origin;
    this.editor.recordOperation({
      apply: {
        type: "image.setProperties",
        data: {
          tileId: this.id,
          changes: { originX: origin.x, originY: origin.y },
        },
      },
      reverse: {
        type: "image.setProperties",
        data: {
          tileId: this.id,
          changes: { originX: oldOrigin.x, originY: oldOrigin.y },
        },
      },
    });
    return this.update({ origin });
  }

  persistText() {
    const state = this.state.value;
    const oldText = this.text.value;
    const text = state ? serialize(state) : null;
    this.text.value = text;
    this.editor.recordOperation({
      apply: {
        type: "image.setProperties",
        data: { tileId: this.id, changes: { text } },
      },
      reverse: {
        type: "image.setProperties",
        data: { tileId: this.id, changes: { text: oldText } },
      },
    });
    return this.update({ text });
  }
}
