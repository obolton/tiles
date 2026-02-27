import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import { ASPECT_RATIOS, DEFAULT_DOCK_SIZE } from "@/constants/size";
import type {
  ClientTile,
  Sizing,
  Animation,
  FrameStyle,
  TileType,
  DockEdge,
} from "api/types/tiles";
import type { Theme } from "api/types/themes";
import type { Fill, FillUpdate } from "@/components/fills/types";
import type { Color } from "@/utils/color";
import type Page from "@/models/Page";
import type { AppRouterInputs } from "@/api/client";
import type TileCollection from "./TileCollection";
import type { TilePropertyChanges } from "@/operations";

export type { Sizing, Animation, FrameStyle, DockEdge };

export default class Tile {
  readonly page: Page;
  readonly id: string;
  readonly type: TileType;

  get editor() {
    if (!this.page.editor) {
      throw new Error("Requires editor context");
    }
    return this.page.editor;
  }

  parent: TileCollection | null = null;

  readonly order: Reactive<string>;
  readonly sizing: Reactive<Sizing>;
  readonly x: Reactive<number>;
  readonly y: Reactive<number>;
  readonly width: Reactive<number | null>;
  readonly height: Reactive<number>;
  readonly rowSpan: Reactive<number>;
  readonly animation: Reactive<Animation | null>;
  readonly frame: Reactive<FrameStyle | null>;
  readonly hide: Reactive<boolean>;
  readonly dock: Reactive<DockEdge | null>;
  readonly theme: Reactive<Theme | null>;
  readonly background: Reactive<Fill | null>;
  readonly textColor: Reactive<Color | null>;

  constructor(page: Page, properties: ClientTile) {
    const {
      id,
      type,
      order,
      sizing,
      x,
      y,
      width,
      height,
      rowSpan,
      animation,
      frame,
      hide,
      dock,
      theme,
      textColor,
      background,
    } = properties;
    this.page = page;

    this.id = id;
    this.type = type;

    this.order = reactive(order);
    this.sizing = reactive(sizing);
    this.x = reactive(x);
    this.y = reactive(y);
    this.width = reactive(width);
    this.height = reactive(height);
    this.rowSpan = reactive(rowSpan);
    this.animation = reactive(animation);
    this.frame = reactive(frame);
    this.hide = reactive(hide);
    this.dock = reactive(dock);
    this.theme = reactive(theme);
    this.textColor = reactive(textColor);
    this.background = reactive(background);
  }

  get index(): number | null {
    return this.parent?.value.indexOf(this) ?? null;
  }

  get previous(): Tile | null {
    if (!this.parent) {
      return null;
    }
    const index = this.index;
    if (index === null) {
      return null;
    }
    return this.parent.value[index - 1] ?? null;
  }

  get next(): Tile | null {
    if (!this.parent) {
      return null;
    }
    const index = this.index;
    if (index === null) {
      return null;
    }
    return this.parent.value[index + 1] ?? null;
  }

  get sectionId() {
    return this.parent?.sectionId ?? null;
  }

  async duplicate({
    sectionId,
    beforeId,
  }: {
    sectionId: string | null;
    beforeId: string | null;
  }) {
    const [parent, ...children] = await client.tiles.duplicate.mutate({
      pageId: this.page.id,
      id: this.id,
      sectionId,
      beforeId,
    });

    const parentTile = this.page.createTile(parent);
    this.editor.addTile(parentTile, parent.sectionId, beforeId);

    for (const child of children) {
      const childTile = this.page.createTile(child);
      this.editor.addTile(childTile, child.sectionId, null);
    }

    return parentTile;
  }

  delete() {
    return this.editor.deleteTiles([this]);
  }

  protected updateTile(
    properties: Omit<AppRouterInputs["tiles"]["update"], "pageId" | "id">,
  ) {
    return client.tiles.update.mutate({
      ...properties,
      pageId: this.page.id,
      id: this.id,
    });
  }

  protected recordUpdate(
    changes: TilePropertyChanges,
    inverse: TilePropertyChanges,
  ) {
    this.editor.recordOperation({
      apply: { type: "tile.setProperties", data: { tileId: this.id, changes } },
      reverse: {
        type: "tile.setProperties",
        data: { tileId: this.id, changes: inverse },
      },
    });
  }

  /**
   * Moves the tile to a new position within a section or the root tile collection.
   */
  protected applyPosition(
    sectionId: string | null | undefined,
    beforeId: string | null | undefined,
  ) {
    if (sectionId === undefined && beforeId === undefined) {
      return;
    }

    const targetSection =
      sectionId !== undefined && sectionId !== null
        ? this.page.getSection(sectionId)
        : null;
    const collection = targetSection?.tiles ?? this.page.tiles;
    collection.insertBefore(beforeId ?? null, this);
  }

  /**
   * Applies changes to reactive values and persists to API.
   * Used by executors for undo/redo (does not record a new operation).
   */
  applyUpdate(changes: TilePropertyChanges) {
    this.applyPosition(changes.sectionId, changes.beforeId);

    if (changes.x !== undefined) {
      this.x.value = changes.x;
    }
    if (changes.y !== undefined) {
      this.y.value = changes.y;
    }
    if (changes.width !== undefined) {
      this.width.value = changes.width;
    }
    if (changes.height !== undefined) {
      this.height.value = changes.height;
    }
    if (changes.sizing !== undefined) {
      this.sizing.value = changes.sizing;
    }
    if (changes.animation !== undefined) {
      this.animation.value = changes.animation;
    }
    if (changes.frame !== undefined) {
      this.frame.value = changes.frame;
    }
    if (changes.hide !== undefined) {
      this.hide.value = changes.hide;
    }
    if (changes.dock !== undefined) {
      this.dock.value = changes.dock;
    }
    if (changes.rowSpan !== undefined) {
      this.rowSpan.value = changes.rowSpan;
    }
    if (changes.textColor !== undefined) {
      this.textColor.value = changes.textColor;
    }
    if (changes.background !== undefined) {
      this.background.value = changes.background;
    }

    return this.updateTile(
      changes as Omit<AppRouterInputs["tiles"]["update"], "pageId" | "id">,
    );
  }

  move({
    sectionId,
    beforeId,
    x,
    y,
    width,
    height,
  }: {
    sectionId?: string | null;
    beforeId?: string | null;
    x?: number;
    y?: number;
    width?: number | null;
    height?: number;
  }) {
    // Capture inverse values before making changes
    const inverse: TilePropertyChanges = {};
    const changes: TilePropertyChanges = {};

    let frame: FrameStyle | null | undefined;

    if (
      (sectionId !== undefined && sectionId !== this.sectionId) ||
      beforeId !== undefined
    ) {
      // Capture current position for undo
      inverse.sectionId = this.sectionId;
      inverse.beforeId = this.next?.id ?? null;
      changes.sectionId = sectionId;
      changes.beforeId = beforeId;

      if (sectionId) {
        const section = this.page.getSection(sectionId);
        section.tiles.insertBefore(beforeId ?? null, this);

        // Reset FULL_BLEED frame when moving to incompatible section
        if (
          this.frame.value === "FULL_BLEED" &&
          (section.layout.value === "GRID" ||
            section.layout.value === "FREEFORM")
        ) {
          inverse.frame = this.frame.value;
          this.frame.value = null;
          frame = null;
          changes.frame = null;
        }
      } else {
        this.page.tiles.insertBefore(beforeId ?? null, this);
      }
    }

    if (typeof x === "number") {
      inverse.x = this.x.value;
      this.x.value = x;
      changes.x = x;
    }
    if (typeof y === "number") {
      inverse.y = this.y.value;
      this.y.value = y;
      changes.y = y;
    }
    if (width !== undefined) {
      inverse.width = this.width.value;
      this.width.value = width;
      changes.width = width;
    }
    if (typeof height === "number") {
      inverse.height = this.height.value;
      this.height.value = height;
      changes.height = height;
    }

    this.recordUpdate(changes, inverse);
    return this.updateTile({ sectionId, beforeId, x, y, width, height, frame });
  }

  setSizing(sizing: Sizing) {
    const inverse: TilePropertyChanges = {
      sizing: this.sizing.value,
      width: this.width.value,
      height: this.height.value,
    };

    this.sizing.value = sizing;

    if (sizing !== "CUSTOM" && sizing !== "AUTO") {
      const ratio = ASPECT_RATIOS[sizing];
      const resolvedWidth = this.width.value ?? this.page.width.value;
      this.height.value = Math.round(resolvedWidth / ratio);
    }

    const changes: TilePropertyChanges = {
      sizing,
      width: this.width.value,
      height: this.height.value,
    };

    this.recordUpdate(changes, inverse);
    return this.updateTile({
      sizing,
      width: this.width.value,
      height: this.height.value,
    });
  }

  setSize({ width, height }: { width?: number | null; height?: number }) {
    const inverse: TilePropertyChanges = {};

    if (width !== undefined) {
      inverse.width = this.width.value;
      this.width.value = width;
    }
    if (typeof height === "number") {
      inverse.height = this.height.value;
      this.height.value = height;
    }

    this.recordUpdate({ width, height }, inverse);
    return this.updateTile({ width, height });
  }

  persistPosition() {
    return this.updateTile({
      x: this.x.value,
      y: this.y.value,
      width: this.width.value,
      height: this.height.value,
    });
  }

  setAnimation(animation: Animation | null) {
    this.recordUpdate({ animation }, { animation: this.animation.value });
    return this.applyUpdate({ animation });
  }

  setFrame(frame: FrameStyle | null) {
    this.recordUpdate({ frame }, { frame: this.frame.value });
    return this.applyUpdate({ frame });
  }

  setHidden(hide: boolean) {
    this.recordUpdate({ hide }, { hide: this.hide.value });
    return this.applyUpdate({ hide });
  }

  async setDock(dock: DockEdge | null, beforeId?: string | null) {
    if (dock === this.dock.value && beforeId === undefined) {
      return;
    }

    // Capture inverse values
    const inverse = {
      dock: this.dock.value,
      sectionId: this.sectionId,
      beforeId: this.next?.id ?? null,
    };

    this.dock.value = dock;

    if (dock) {
      this.page.dockedTiles[dock].insertBefore(beforeId ?? null, this);
      if (this.page.dockSizes.value[dock] === null) {
        this.page.setDockSizes({ [dock]: DEFAULT_DOCK_SIZE });
      }
    } else {
      this.page.tiles.insertBefore(beforeId ?? null, this);
    }

    this.recordUpdate({ dock, beforeId }, inverse);
    await this.updateTile({ dock, beforeId });
  }

  async setTheme(themeId: string | null) {
    const oldThemeId = this.theme.value?.id ?? null;
    this.recordUpdate({ themeId }, { themeId: oldThemeId });
    const result = await this.updateTile({ themeId });
    this.theme.value = result.theme;
  }

  setTextColor(textColor: Color | null) {
    this.recordUpdate({ textColor }, { textColor: this.textColor.value });
    return this.applyUpdate({ textColor });
  }

  async setBackground(background: FillUpdate) {
    const previousBackground = this.background.value;
    const result = await this.updateTile({ background });
    this.background.value = result.background;
    this.recordUpdate(
      { background: result.background },
      { background: previousBackground },
    );
  }

  async moveUp() {
    const previous = this.previous;
    if (!previous) {
      return;
    }

    // For undo, we need to move back after the current previous tile
    const inverseBeforeId = this.next?.id ?? null;
    const beforeId = previous.id;

    this.parent?.insertBefore(beforeId, this);

    this.recordUpdate(
      { sectionId: this.sectionId, beforeId },
      { sectionId: this.sectionId, beforeId: inverseBeforeId },
    );
    return this.updateTile({
      sectionId: this.sectionId,
      beforeId,
    });
  }

  async moveDown() {
    const next = this.next;
    if (!next) {
      return;
    }

    // For undo, we need to move back before the tile that was after us
    const inverseBeforeId = next.id;
    const beforeId = next.next?.id ?? null;

    this.parent?.insertBefore(beforeId, this);

    this.recordUpdate(
      { sectionId: this.sectionId, beforeId },
      { sectionId: this.sectionId, beforeId: inverseBeforeId },
    );
    return this.updateTile({
      sectionId: this.sectionId,
      beforeId,
    });
  }
}
