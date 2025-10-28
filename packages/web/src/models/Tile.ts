import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import { LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import type {
  ClientTile,
  Anchor,
  Dimensions,
  Animation,
  TileType,
} from "api/types/tiles";
import type Editor from "@/editor/Editor";
import type { AppRouterInputs } from "@/api/client";

export type { Anchor, Dimensions, Animation };

export default class Tile {
  readonly editor: Editor;
  readonly id: string;
  readonly type: TileType;

  readonly sectionId: Reactive<string | null>;
  readonly order: Reactive<string>;
  readonly anchor: Reactive<Anchor | null>;
  readonly dimensions: Reactive<Dimensions>;
  readonly x: Reactive<number>;
  readonly y: Reactive<number>;
  readonly width: Reactive<number>;
  readonly height: Reactive<number>;
  readonly rowSpan: Reactive<number>;
  readonly block: Reactive<boolean>;
  readonly animation: Reactive<Animation | null>;
  readonly hide: Reactive<boolean>;

  constructor(editor: Editor, properties: ClientTile) {
    const {
      id,
      type,
      sectionId,
      order,
      anchor,
      dimensions,
      x,
      y,
      width,
      height,
      rowSpan,
      block,
      animation,
      hide,
    } = properties;
    this.editor = editor;

    this.id = id;
    this.type = type;

    this.sectionId = reactive(sectionId);
    this.order = reactive(order);
    this.anchor = reactive(anchor);
    this.dimensions = reactive(dimensions);
    this.x = reactive(x);
    this.y = reactive(y);
    this.width = reactive(width);
    this.height = reactive(height);
    this.rowSpan = reactive(rowSpan);
    this.block = reactive(block);
    this.animation = reactive(animation);
    this.hide = reactive(hide);
  }

  duplicate({ sectionId }: { sectionId: string | null }) {
    return client.tiles.duplicate.mutate({
      pageId: this.editor.pageId,
      id: this.id,
      sectionId,
    });
  }

  delete() {
    return this.editor.deleteTiles([this.id]);
  }

  protected updateTile(
    properties: Omit<AppRouterInputs["tiles"]["update"], "pageId" | "id">,
  ) {
    return client.tiles.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setAnchor(anchor: Anchor | null) {
    this.anchor.value = anchor;
    return this.updateTile({ anchor });
  }

  setDimensions(dimensions: Dimensions) {
    this.dimensions.value = dimensions;

    switch (dimensions) {
      case "LANDSCAPE":
        this.width.value = LANDSCAPE_SIZE.width;
        this.height.value = LANDSCAPE_SIZE.height;
        break;
      case "PORTRAIT":
        this.width.value = PORTRAIT_SIZE.width;
        this.height.value = PORTRAIT_SIZE.height;
        break;
    }

    return this.updateTile({
      dimensions,
      width: this.width.value,
      height: this.height.value,
    });
  }

  setSize({ width, height }: { width: number; height: number }) {
    this.width.value = width;
    this.height.value = height;
    return this.updateTile({ width, height });
  }

  persistSize() {
    return this.updateTile({
      width: this.width.value,
      height: this.height.value,
      block: this.block.value,
    });
  }

  setAnimation(animation: Animation | null) {
    this.animation.value = animation;
    return this.updateTile({ animation });
  }

  setHidden(hide: boolean) {
    this.hide.value = hide;
    return this.updateTile({ hide });
  }
}
