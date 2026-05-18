import * as Y from "yjs";
import { generateKeyBetween } from "jittered-fractional-indexing";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import Theme from "@/models/Theme";
import { ASPECT_RATIOS } from "@/constants/size";
import { LOCAL_ORIGIN, YMapBinding } from "@/collaboration/YMapBinding";
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
import { toParentId, parseParentId } from "./parentId";
import type TileCollection from "./TileCollection";
import type { TilePropertyChanges } from "@/operations";

export type { Sizing, Animation, FrameStyle, DockEdge };

function writeInitialTileFields(
  tileMap: Y.Map<unknown>,
  properties: ClientTile,
) {
  tileMap.set("order", properties.order);
  tileMap.set("sizing", properties.sizing);
  tileMap.set("x", properties.x);
  tileMap.set("y", properties.y);
  tileMap.set("height", properties.height);
  tileMap.set("rowSpan", properties.rowSpan);
  tileMap.set("hide", properties.hide);

  const parentId = toParentId(properties.sectionId, properties.dock);
  if (parentId !== null) {
    tileMap.set("parentId", parentId);
  }

  if (properties.width !== null) {
    tileMap.set("width", properties.width);
  }
  if (properties.startDate !== null) {
    tileMap.set("startDate", properties.startDate);
  }
  if (properties.endDate !== null) {
    tileMap.set("endDate", properties.endDate);
  }
  if (properties.lat !== null && properties.long !== null) {
    tileMap.set("coordinates", {
      lat: properties.lat,
      long: properties.long,
    });
  }
  if (properties.animation !== null) {
    tileMap.set("animation", properties.animation);
  }
  if (properties.frame !== null) {
    tileMap.set("frame", properties.frame);
  }
  if (properties.cornerRadius !== null) {
    tileMap.set("cornerRadius", properties.cornerRadius);
  }
  if (properties.textColor !== null) {
    tileMap.set("textColor", properties.textColor);
  }
  if (properties.background !== null) {
    tileMap.set("background", properties.background);
  }
}

function resolveOrCreateTileMap(
  page: Page,
  properties: ClientTile,
): Y.Map<unknown> | null {
  if (!page.doc) {
    return null;
  }
  const tilesMap = page.doc.getMap<Y.Map<unknown>>("tiles");
  let tileMap = tilesMap.get(properties.id);
  if (!tileMap) {
    page.doc.transact(() => {
      tileMap = new Y.Map<unknown>();
      writeInitialTileFields(tileMap, properties);
      tilesMap.set(properties.id, tileMap);
    }, LOCAL_ORIGIN);
  }
  return tileMap ?? null;
}

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

  protected readonly binding: YMapBinding | null;

  readonly order: Reactive<string>;
  readonly parentId: Reactive<string | null>;
  readonly sizing: Reactive<Sizing>;
  readonly x: Reactive<number>;
  readonly y: Reactive<number>;
  readonly width: Reactive<number | null>;
  readonly height: Reactive<number>;
  readonly rowSpan: Reactive<number>;
  readonly startDate: Reactive<string | null>;
  readonly endDate: Reactive<string | null>;
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
    const { id, type, order, theme } = properties;
    this.page = page;

    this.id = id;
    this.type = type;

    const tileMap = resolveOrCreateTileMap(page, properties);
    this.binding =
      tileMap && page.doc ? new YMapBinding(tileMap, page.doc) : null;

    this.order = this.bind<string>("order", order);
    this.parentId = this.bind<string | null>(
      "parentId",
      toParentId(properties.sectionId, properties.dock),
    );
    this.sizing = this.bind<Sizing>("sizing", "CUSTOM");
    this.x = this.bind("x", 0);
    this.y = this.bind("y", 0);
    this.width = this.bind<number | null>("width", null);
    this.height = this.bind("height", 0);
    this.rowSpan = this.bind("rowSpan", 1);
    this.startDate = this.bind<string | null>("startDate", null);
    this.endDate = this.bind<string | null>("endDate", null);
    this.coordinates = this.bind<{ lat: number; long: number } | null>(
      "coordinates",
      null,
    );
    this.animation = this.bind<Animation | null>("animation", null);
    this.frame = this.bind<FrameStyle | null>("frame", null);
    this.cornerRadius = this.bind<number | null>("cornerRadius", null);
    this.hide = this.bind("hide", false);
    this.dock = this.parentId.derive((parentId) => {
      const parent = parseParentId(parentId);
      return parent.type === "dock" ? parent.edge : null;
    });
    this.theme = reactive(theme ? new Theme(theme) : null);
    this.textColor = this.bind<Color | null>("textColor", null);
    this.background = this.bind<Fill | null>("background", null);
  }

  /**
   * Binds a property to this tile's map if available.
   */
  protected bind<T>(key: string, initial: T): Reactive<T> {
    return this.binding ? this.binding.field(key, initial) : reactive(initial);
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
      startDate: this.startDate.value,
      endDate: this.endDate.value,
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
   * Applies changes to reactive values.
   * Used by executors for undo/redo (does not record a new operation).
   * Placement (parentId/order) is Y.Doc-authoritative and not handled here.
   */
  applyUpdate(changes: TilePropertyChanges) {
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
    if (changes.rowSpan !== undefined) {
      this.rowSpan.value = changes.rowSpan;
    }
    if (changes.startDate !== undefined) {
      this.startDate.value = changes.startDate;
    }
    if (changes.endDate !== undefined) {
      this.endDate.value = changes.endDate;
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

  /**
   * A fractional order key positioning this tile before `beforeId` (or last
   * when null/missing) within `parentId`'s collection. Single pass; this tile
   * is skipped so a within-collection move computes the correct gap.
   */
  private orderBefore(
    parentId: string | null,
    beforeId: string | null | undefined,
  ): string {
    let prev: Tile | undefined;
    let next: Tile | undefined;

    for (const item of this.page.placement.getCollection(parentId).value) {
      if (item === this) {
        continue;
      }
      if (beforeId != null && item.id === beforeId) {
        next = item;
        break;
      }
      prev = item;
    }

    return generateKeyBetween(
      prev?.order.value ?? null,
      next?.order.value ?? null,
    );
  }

  /**
   * Moves and/or repositions the tile. Placement (`parentId`/`order`) is
   * written to the Y.Doc only; the controller's observer reconciles the
   * collections. Geometry still persists to Postgres until the projection
   * lands. No tRPC and no undo record for the placement itself.
   */
  move({
    parentId,
    beforeId,
    x,
    y,
    width,
    height,
    lat,
    long,
  }: {
    parentId?: string | null;
    beforeId?: string | null;
    x?: number;
    y?: number;
    width?: number | null;
    height?: number;
    lat?: number | null;
    long?: number | null;
  }) {
    const reparenting =
      parentId !== undefined && parentId !== this.parentId.value;
    const repositioning = beforeId !== undefined;

    const apply = () => {
      if (reparenting || repositioning) {
        const targetParentId =
          parentId !== undefined ? parentId : this.parentId.value;
        this.order.value = this.orderBefore(targetParentId, beforeId);
        this.parentId.value = targetParentId;
      }

      if (typeof x === "number") {
        this.x.value = x;
      }
      if (typeof y === "number") {
        this.y.value = y;
      }
      if (width !== undefined) {
        this.width.value = width;
      }
      if (typeof height === "number") {
        this.height.value = height;
      }
      if (lat !== undefined || long !== undefined) {
        const prev = this.coordinates.value;
        const newLat = lat ?? prev?.lat ?? null;
        const newLong = long ?? prev?.long ?? null;
        this.coordinates.value =
          newLat != null && newLong != null
            ? { lat: newLat, long: newLong }
            : null;
      }
    };

    if (this.binding) {
      this.binding.transact(apply, LOCAL_ORIGIN);
    } else {
      apply();
    }

    const geometry = { x, y, width, height, lat, long };
    const hasGeometry = Object.values(geometry).some(
      (value) => value !== undefined,
    );
    return hasGeometry ? this.updateTile(geometry) : Promise.resolve();
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

  setDates(startDate: string | null, endDate: string | null) {
    const inverse: TilePropertyChanges = {
      startDate: this.startDate.value,
      endDate: this.endDate.value,
    };

    this.startDate.value = startDate;
    this.endDate.value = endDate;

    this.recordUpdate({ startDate, endDate }, inverse);
    return this.updateTile({ startDate, endDate });
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
    if (previous) {
      await this.move({ beforeId: previous.id });
    }
  }

  async moveDown() {
    const next = this.next;
    if (next) {
      await this.move({ beforeId: next.next?.id ?? null });
    }
  }
}
