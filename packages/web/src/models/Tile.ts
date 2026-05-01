import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import { toISODate } from "@/utils/dates";
import Theme from "@/models/Theme";
import { ASPECT_RATIOS } from "@/constants/size";
import type {
  ClientTile,
  ClientTileBase,
  Sizing,
  Animation,
  FrameStyle,
  TileType,
  DockEdge,
} from "api/types/tiles";
import type { Fill, FillUpdate } from "@/components/fills/types";
import type { Color } from "@/utils/color";
import type Page from "@/models/Page";
import type { AppRouterInputs } from "@/api/client";
import type TileCollection from "./TileCollection";
import type { TilePropertyChanges } from "@/operations";

export type { Sizing, Animation, FrameStyle, DockEdge };

export default abstract class Tile {
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
  readonly startDate: Reactive<Date | null>;
  readonly endDate: Reactive<Date | null>;
  readonly coordinates: Reactive<{ lat: number; long: number } | null>;
  readonly animation: Reactive<Animation | null>;
  readonly frame: Reactive<FrameStyle | null>;
  readonly cornerRadius: Reactive<number | null>;
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
      startDate,
      endDate,
      lat,
      long,
      animation,
      frame,
      cornerRadius,
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
    this.startDate = reactive(startDate ? new Date(startDate) : null);
    this.endDate = reactive(endDate ? new Date(endDate) : null);
    this.coordinates = reactive(
      lat != null && long != null ? { lat, long } : null,
    );
    this.animation = reactive(animation);
    this.frame = reactive(frame);
    this.cornerRadius = reactive(cornerRadius);
    this.hide = reactive(hide);
    this.dock = reactive(dock);
    this.theme = reactive(theme ? new Theme(theme) : null);
    this.textColor = reactive(textColor);
    this.background = reactive(background);
  }

  serialize(): ClientTileBase {
    return {
      id: this.id,
      type: this.type,
      sectionId: this.sectionId,
      theme: this.theme.value?.serialize() ?? null,
      order: this.order.value,
      sizing: this.sizing.value,
      x: this.x.value,
      y: this.y.value,
      width: this.width.value,
      height: this.height.value,
      rowSpan: this.rowSpan.value,
      startDate: this.startDate.value ? toISODate(this.startDate.value) : null,
      endDate: this.endDate.value ? toISODate(this.endDate.value) : null,
      lat: this.coordinates.value?.lat ?? null,
      long: this.coordinates.value?.long ?? null,
      cornerRadius: this.cornerRadius.value,
      animation: this.animation.value,
      frame: this.frame.value,
      hide: this.hide.value,
      dock: this.dock.value,
      textColor: this.textColor.value,
      background: this.background.value,
    };
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
   * Applies changes to reactive values.
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
    if (changes.cornerRadius !== undefined) {
      this.cornerRadius.value = changes.cornerRadius;
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
    if (changes.startDate !== undefined) {
      this.startDate.value = changes.startDate
        ? new Date(changes.startDate)
        : null;
    }
    if (changes.endDate !== undefined) {
      this.endDate.value = changes.endDate ? new Date(changes.endDate) : null;
    }
    if (changes.lat !== undefined || changes.long !== undefined) {
      const lat = changes.lat ?? this.coordinates.value?.lat ?? null;
      const long = changes.long ?? this.coordinates.value?.long ?? null;
      this.coordinates.value =
        lat != null && long != null ? { lat, long } : null;
    }
    if (changes.textColor !== undefined) {
      this.textColor.value = changes.textColor;
    }
    if (changes.background !== undefined) {
      this.background.value = changes.background;
    }
  }

  move({
    sectionId,
    beforeId,
    x,
    y,
    width,
    height,
    lat,
    long,
  }: {
    sectionId?: string | null;
    beforeId?: string | null;
    x?: number;
    y?: number;
    width?: number | null;
    height?: number;
    lat?: number | null;
    long?: number | null;
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
            section.layout.value === "FREEFORM" ||
            section.layout.value === "MAP")
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
    if (lat !== undefined || long !== undefined) {
      const prev = this.coordinates.value;
      inverse.lat = prev?.lat ?? null;
      inverse.long = prev?.long ?? null;
      const newLat = lat ?? prev?.lat ?? null;
      const newLong = long ?? prev?.long ?? null;
      this.coordinates.value =
        newLat != null && newLong != null
          ? { lat: newLat, long: newLong }
          : null;
      changes.lat = newLat;
      changes.long = newLong;
    }

    this.recordUpdate(changes, inverse);
    return this.updateTile({
      sectionId,
      beforeId,
      x,
      y,
      width,
      height,
      lat,
      long,
      frame,
    });
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

  setCoordinates(coordinates: { lat: number; long: number } | null) {
    const prev = this.coordinates.value;
    const inverse: TilePropertyChanges = {
      lat: prev?.lat ?? null,
      long: prev?.long ?? null,
    };

    this.coordinates.value = coordinates;

    const changes: TilePropertyChanges = {
      lat: coordinates?.lat ?? null,
      long: coordinates?.long ?? null,
    };

    this.recordUpdate(changes, inverse);
    return this.updateTile({
      lat: coordinates?.lat ?? null,
      long: coordinates?.long ?? null,
    });
  }

  setDates(startDate: Date | null, endDate: Date | null) {
    const inverse: TilePropertyChanges = {
      startDate: this.startDate.value ? toISODate(this.startDate.value) : null,
      endDate: this.endDate.value ? toISODate(this.endDate.value) : null,
    };

    this.startDate.value = startDate;
    this.endDate.value = endDate;

    const changes: TilePropertyChanges = {
      startDate: startDate ? toISODate(startDate) : null,
      endDate: endDate ? toISODate(endDate) : null,
    };

    this.recordUpdate(changes, inverse);
    return this.updateTile({
      startDate: startDate ? toISODate(startDate) : null,
      endDate: endDate ? toISODate(endDate) : null,
    });
  }

  persistPosition() {
    return this.updateTile({
      x: this.x.value,
      y: this.y.value,
      width: this.width.value,
      height: this.height.value,
      rowSpan: this.rowSpan.value,
      lat: this.coordinates.value?.lat ?? null,
      long: this.coordinates.value?.long ?? null,
    });
  }

  setAnimation(animation: Animation | null) {
    this.recordUpdate({ animation }, { animation: this.animation.value });
    this.applyUpdate({ animation });
    return this.updateTile({ animation });
  }

  setFrame(frame: FrameStyle | null) {
    this.recordUpdate({ frame }, { frame: this.frame.value });
    this.applyUpdate({ frame });
    return this.updateTile({ frame });
  }

  setCornerRadius(cornerRadius: number | null) {
    this.recordUpdate(
      { cornerRadius },
      { cornerRadius: this.cornerRadius.value },
    );
    this.applyUpdate({ cornerRadius });
    return this.updateTile({ cornerRadius });
  }

  setHidden(hide: boolean) {
    this.recordUpdate({ hide }, { hide: this.hide.value });
    this.applyUpdate({ hide });
    return this.updateTile({ hide });
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
    this.theme.value = result.theme ? new Theme(result.theme) : null;
  }

  setTextColor(textColor: Color | null) {
    this.recordUpdate({ textColor }, { textColor: this.textColor.value });
    this.applyUpdate({ textColor });
    return this.updateTile({ textColor });
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
