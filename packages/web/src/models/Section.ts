import Tile from "./Tile";
import {
  reactive,
  type Reactive,
  type ComputedReactive,
} from "@/utils/reactivity";
import client from "@/api/client";
import { LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import type {
  ClientSectionTile,
  Layout,
  Anchor,
  Dimensions,
} from "api/types/tiles";
import type Editor from "@/editor/Editor";
import type {
  Background,
  BackgroundUpdate,
} from "@/components/backgrounds/types";
import type { AppRouterInputs } from "@/api/client";
import type { Tile as TileProperties } from "@/types/tiles";

export default class Section extends Tile {
  readonly background: Reactive<Background | null>;
  readonly layout: Reactive<Layout>;
  readonly anchor: Reactive<Anchor | null>;
  readonly dimensions: Reactive<Dimensions>;
  readonly hide: Reactive<boolean>;
  readonly tiles: ComputedReactive<TileProperties[]>;

  constructor(editor: Editor, properties: ClientSectionTile) {
    super(editor, properties);

    const { id, layout, anchor, dimensions, background, hide } = properties;
    this.layout = reactive(layout);
    this.anchor = reactive(anchor);
    this.dimensions = reactive(dimensions);
    this.background = reactive(background);
    this.hide = reactive(hide);
    this.tiles = editor.tiles.derive((tiles) =>
      tiles.filter((tile) => tile.sectionId.value === id),
    );
  }

  private update(
    properties: Omit<AppRouterInputs["sections"]["update"], "pageId" | "id">,
  ) {
    return client.sections.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  async setLayout(layout: Layout) {
    this.layout.value = layout;
    return this.update({ layout });
  }

  async setAnchor(anchor: Anchor | null) {
    this.anchor.value = anchor;
    return this.update({ anchor });
  }

  async setDimensions(dimensions: Dimensions) {
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

    return this.update({
      dimensions,
      width: this.width.value,
      height: this.height.value,
    });
  }

  async setSize(width: number, height: number) {
    this.width.value = width;
    this.height.value = height;
    this.dimensions.value = "CUSTOM";
    return this.update({ width, height, dimensions: "CUSTOM" });
  }

  async setBackground(background: BackgroundUpdate) {
    const result = await this.update({ background });
    this.background.value = result.background;
  }

  async setHidden(hide: boolean) {
    this.hide.value = hide;
    return this.update({ hide });
  }
}
