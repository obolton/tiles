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
import type { Theme } from "api/types/themes";
import type Editor from "@/editor/Editor";
import type { AppRouterInputs } from "@/api/client";
import type { TileParent } from "./TileCollection";

export type { Anchor, Dimensions, Animation };

export default class Tile {
  readonly editor: Editor;
  readonly id: string;
  readonly type: TileType;

  parent: TileParent | null = null;

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
  readonly theme: Reactive<Theme | null>;

  constructor(editor: Editor, properties: ClientTile) {
    const {
      id,
      type,
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
      theme,
    } = properties;
    this.editor = editor;

    this.id = id;
    this.type = type;

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
    this.theme = reactive(theme);
  }

  get index(): number | null {
    return this.parent?.tiles.value.indexOf(this) ?? null;
  }

  get previous(): Tile | null {
    if (!this.parent) {
      return null;
    }
    const index = this.index;
    if (index === null) {
      return null;
    }
    return this.parent.tiles.value[index - 1] ?? null;
  }

  get next(): Tile | null {
    if (!this.parent) {
      return null;
    }
    const index = this.index;
    if (index === null) {
      return null;
    }
    return this.parent.tiles.value[index + 1] ?? null;
  }

  get sectionId() {
    return this.parent?.id ?? null;
  }

  duplicate({ sectionId }: { sectionId: string | null }) {
    return client.tiles.duplicate.mutate({
      pageId: this.editor.pageId,
      id: this.id,
      sectionId,
    });
  }

  delete() {
    return this.editor.deleteTiles([this]);
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

  move({
    sectionId,
    afterId,
    x,
    y,
    width,
    height,
  }: {
    sectionId?: string | null;
    afterId?: string | null;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) {
    if (
      (typeof sectionId !== "undefined" && sectionId !== this.sectionId) ||
      typeof afterId !== "undefined"
    ) {
      if (sectionId) {
        const section = this.editor.getSection(sectionId);
        section.tiles.insertAfter(afterId ?? null, this);
      } else {
        this.editor.tiles.insertAfter(afterId ?? null, this);
      }
    }

    if (typeof x === "number") {
      this.x.value = x;
    }
    if (typeof y === "number") {
      this.y.value = y;
    }
    if (typeof width === "number") {
      this.width.value = width;
    }
    if (typeof height === "number") {
      this.height.value = height;
    }

    return this.updateTile({ sectionId, afterId, x, y, width, height });
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

  setSize({
    width,
    height,
    block,
  }: {
    width?: number;
    height?: number;
    block?: boolean;
  }) {
    if (typeof width === "number") {
      this.width.value = width;
    }
    if (typeof height === "number") {
      this.height.value = height;
    }
    if (typeof block === "boolean") {
      this.block.value = block;
    }
    return this.updateTile({ width, height, block });
  }

  persistPosition() {
    return this.updateTile({
      x: this.x.value,
      y: this.y.value,
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

  async setTheme(themeId: string | null) {
    const result = await this.updateTile({ themeId });
    this.theme.value = result.theme;
  }

  async moveUp() {
    const previous = this.previous;
    if (!previous) {
      return;
    }

    const afterId = previous.previous?.id ?? null;
    this.parent?.tiles.insertAfter(afterId, this);

    return this.updateTile({
      sectionId: this.sectionId,
      afterId,
    });
  }

  async moveDown() {
    const afterId = this.next?.id;
    if (!afterId) {
      return;
    }

    this.parent?.tiles.insertAfter(afterId, this);

    return this.updateTile({
      sectionId: this.sectionId,
      afterId,
    });
  }
}
