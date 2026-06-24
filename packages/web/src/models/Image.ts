import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import { buildImageMap } from "doc/tiles/image";
import { reactive, type Reactive } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { getImageUrl } from "@/utils/images";
import type Page from "@/models/Page";
import type { ImageTile } from "doc/types/tiles";
import type { EditorState } from "prosemirror-state";

export interface ImageOrigin {
  x: number;
  y: number;
}

export interface CreateImageInput extends Omit<CreateTileInput, "type"> {
  imageId: string;
  size: { width: number; height: number };
  alt?: string | null;
  text?: ImageTile["text"];
}

export default class Image extends Tile {
  readonly type = "IMAGE";

  readonly imageId: Reactive<string | null>;
  readonly size: Reactive<{ width: number; height: number }>;
  readonly alt: Reactive<string | null>;
  readonly text: Reactive<ImageTile["text"]>;
  readonly origin: Reactive<ImageOrigin>;
  readonly state: Reactive<EditorState | null>;

  get imageUrl(): string | null {
    const imageId = this.imageId.value;
    return imageId ? getImageUrl(imageId) : null;
  }

  static createMap(
    properties: Omit<CreateImageInput, "parentId" | "beforeId">,
  ): Y.Map<unknown> {
    return buildImageMap(properties);
  }

  static async create(page: Page, data: CreateImageInput): Promise<Image> {
    const { parentId, beforeId, ...rest } = data;
    const map = Image.createMap(rest);
    const image = page.createTile(map, { parentId, beforeId }) as Image;
    image.editor.addTile(image);
    return image;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.imageId = this.binding.field("imageId", null);
    this.size = this.binding.field("size", { width: 0, height: 0 });
    this.alt = this.binding.field("alt", null);
    this.text = this.binding.field("text", null);
    this.origin = this.binding.field("origin", { x: 0, y: 0 });
    this.state = reactive(null);
  }

  serialize(): ImageTile {
    return {
      ...super.serialize(),
      type: "IMAGE",
      imageId: this.imageId.value,
      image: this.size.value,
      alt: this.alt.value,
      originX: this.origin.value.x,
      originY: this.origin.value.y,
      text: this.text.value,
    };
  }

  persistText() {
    const state = this.state.value;
    this.text.value = state ? serialize(state) : null;
  }
}
