import * as Y from "yjs";
import { combine, type Reactive } from "@/utils/reactivity";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";
import { ASPECT_RATIOS } from "@/constants/size";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Sizing, Animation, FrameStyle, TileType, DockEdge } from "doc/types/enums";
import type { Fill } from "@/components/fills/types";
import type { Color } from "@/utils/color";
import type Page from "@/models/Page";
import type TileCollection from "./TileCollection";

export type { Sizing, Animation, FrameStyle, DockEdge };

export type { CreateTileInput } from "doc/tiles/base";

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

  protected map: Y.Map<unknown>;
  protected binding: YMapBinding;

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
  readonly themeId: Reactive<string | null>;
  readonly theme: Reactive<ThemeData | null>;
  readonly background: Reactive<Fill | null>;
  readonly textColor: Reactive<Color | null>;

  constructor(page: Page, map: Y.Map<unknown>) {
    this.page = page;
    this.map = map;

    const id = map.get("id");
    const type = map.get("type");

    if (typeof id !== "string" || !id) {
      throw new Error("Missing ID");
    }

    if (typeof type !== "string" || !type) {
      throw new Error("Missing type");
    }

    this.id = id;
    this.type = type as TileType; // TODO: Validate

    this.binding = new YMapBinding(map);

    this.order = this.binding.field("order", "");
    this.parentId = this.binding.field("parentId", null);
    this.sizing = this.binding.field("sizing", "AUTO");
    this.x = this.binding.field("x", 0);
    this.y = this.binding.field("y", 0);
    this.width = this.binding.field("width", null);
    this.height = this.binding.field("height", 0);
    this.rowSpan = this.binding.field("rowSpan", 0);
    this.startDate = this.binding.field("startDate", null);
    this.endDate = this.binding.field("endDate", null);
    this.coordinates = this.binding.field("coordinates", null);
    this.animation = this.binding.field("animation", null);
    this.frame = this.binding.field("frame", null);
    this.cornerRadius = this.binding.field("cornerRadius", null);
    this.hide = this.binding.field("hide", false);
    this.themeId = this.binding.field("themeId", null);
    this.theme = combine({ id: this.themeId, themes: this.page.themes }, ({ id, themes }) =>
      id ? (themes.get(id) ?? null) : null,
    );
    this.textColor = this.binding.field("textColor", null);
    this.background = this.binding.field("background", null);
  }

  dispose() {
    this.binding.dispose();
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

  async duplicate({
    parentId,
    beforeId,
  }: {
    parentId: string | null;
    beforeId: string | null;
  }): Promise<Tile> {
    const cloned = this.page.createTile(this.map.clone(), {
      parentId,
      beforeId,
    });

    for (const child of this.page.placement.getCollection(this.id).value) {
      this.page.createTile(child.map.clone(), {
        parentId: cloned.id,
        beforeId: null,
      });
    }
    return cloned;
  }

  delete() {
    return this.editor.deleteTiles([this.id]);
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
    const reparenting = parentId !== undefined && parentId !== this.parentId.value;
    const repositioning = beforeId !== undefined;

    const apply = () => {
      if (reparenting || repositioning) {
        const targetParentId = parentId !== undefined ? parentId : this.parentId.value;
        this.order.value = this.page.placement.orderBefore(targetParentId, beforeId, this);
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
          newLat != null && newLong != null ? { lat: newLat, long: newLong } : null;
      }
    };

    this.page.doc.transact(apply);
  }

  setSizing(sizing: Sizing) {
    this.page.doc.transact(() => {
      this.sizing.value = sizing;

      if (sizing !== "CUSTOM" && sizing !== "AUTO") {
        const ratio = ASPECT_RATIOS[sizing];
        const resolvedWidth = this.width.value ?? this.page.width.value;
        this.height.value = Math.round(resolvedWidth / ratio);
      }
    });
  }

  setSize({ width, height }: { width?: number | null; height?: number }) {
    this.page.doc.transact(() => {
      if (width !== undefined) {
        this.width.value = width;
      }
      if (typeof height === "number") {
        this.height.value = height;
      }
    });
  }

  setDates(startDate: string | null, endDate: string | null) {
    this.page.doc.transact(() => {
      this.startDate.value = startDate;
      this.endDate.value = endDate;
    });
  }

  setTheme(theme: Theme | null) {
    this.page.doc.transact(() => {
      if (theme) {
        this.page.themes.apply(theme);
      }
      this.themeId.value = theme?.id ?? null;
    });
  }

  moveUp() {
    const previous = this.previous;
    if (previous) {
      this.move({ beforeId: previous.id });
    }
  }

  moveDown() {
    const next = this.next;
    if (next) {
      this.move({ beforeId: next.next?.id ?? null });
    }
  }
}
