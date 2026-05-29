import client from "@/api/client";
import Dropdown from "@/models/Dropdown";
import PageInvite from "@/models/PageInvite";
import PageThemes from "@/models/PageThemes";
import TileCollection from "@/models/TileCollection";
import TilePlacement from "@/models/TilePlacement";
import { dockParentId } from "@/models/parentId";
import Section from "@/models/Section";
import createTileFromData from "@/models/createTile";
import { LOCAL_ORIGIN, YMapBinding } from "@/collaboration/YMapBinding";
import { reactive, array, combine } from "@/utils/reactivity";
import * as Y from "yjs";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";
import type { Color } from "@/utils/color";
import type { FontId } from "api/config/fonts";
import type { PageAccess } from "@/types/collaboration";
import type { Awareness } from "@/collaboration/types";
import type { PagePropertyChanges } from "@/operations";
import type { DockEdge } from "api/types/tiles";
import type { HorizontalAlignment, PageType } from "api/types/pages";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";

export type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type TileClass<T extends Tile = Tile> = abstract new (...args: any[]) => T;

export default class Page {
  editor?: Editor;
  readonly doc: Y.Doc;

  readonly id: string;
  readonly workspaceId: string;
  readonly updatedAt: Date;
  readonly author: PageData["author"];
  readonly type: PageType;
  readonly title: Reactive<string>;
  readonly backgroundColor: Reactive<Color | null>;
  readonly font: Reactive<FontId | null>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly folderId: Reactive<string | null>;
  readonly themes: PageThemes;
  readonly themeId: Reactive<string | null>;
  readonly theme: Reactive<ThemeData | null>;
  readonly width: Reactive<number>;
  readonly alignment: Reactive<HorizontalAlignment>;
  readonly dockSizes: Reactive<Record<DockEdge, number>>;
  readonly dropdowns: ReactiveArray<Dropdown>;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<PageInvite>;
  readonly index: Map<string, Tile>;
  readonly placement: TilePlacement;
  private readonly metadataBinding: YMapBinding;

  /** The page-root tiles, as a controller-maintained order-sorted view. */
  get tiles(): TileCollection {
    return this.placement.getCollection(null);
  }

  /** The docked tiles per edge, as controller-maintained views. */
  get dockedTiles(): Record<
    "TOP" | "LEFT" | "RIGHT" | "BOTTOM",
    TileCollection
  > {
    return {
      TOP: this.placement.getCollection(dockParentId("TOP")),
      LEFT: this.placement.getCollection(dockParentId("LEFT")),
      RIGHT: this.placement.getCollection(dockParentId("RIGHT")),
      BOTTOM: this.placement.getCollection(dockParentId("BOTTOM")),
    };
  }

  constructor(data: PageData, doc: Y.Doc) {
    this.doc = doc;
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.updatedAt = new Date(data.updatedAt);
    this.author = data.author;
    this.type = data.type;
    this.title = reactive(data.title);
    this.font = reactive(data.font);
    this.coverImageUrl = reactive(data.coverImageUrl);
    this.isPublished = reactive(data.published);
    this.folderId = reactive(data.folderId);
    this.themes = new PageThemes(doc);
    this.metadataBinding = new YMapBinding(doc.getMap("metadata"));
    this.themeId = this.metadataBinding.field("themeId", null);
    this.backgroundColor = this.metadataBinding.field("backgroundColor", null);
    this.theme = combine(
      { id: this.themeId, themes: this.themes },
      ({ id, themes }) => (id ? (themes.get(id) ?? null) : null),
    );
    this.width = reactive(data.width);
    this.alignment = reactive(data.alignment);
    this.dockSizes = reactive({
      TOP: data.dockTopHeight,
      BOTTOM: data.dockBottomHeight,
      LEFT: data.dockLeftWidth,
      RIGHT: data.dockRightWidth,
    });
    this.dropdowns = array(data.dropdowns.map((d) => new Dropdown(this, d)));
    this.access = array(data.access);
    this.invites = array(data.invites.map((i) => new PageInvite(this, i)));
    this.index = new Map();
    this.placement = new TilePlacement(this);
  }

  get awareness(): Awareness | null {
    return this.editor?.collaboration?.awareness ?? null;
  }

  serialize(): Omit<PageData, "tiles" | "document"> {
    const dockSizes = this.dockSizes.value;
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      updatedAt: this.updatedAt.toISOString(),
      author: this.author,
      type: this.type,
      title: this.title.value,
      font: this.font.value,
      coverImageUrl: this.coverImageUrl.value,
      published: this.isPublished.value,
      folderId: this.folderId.value,
      width: this.width.value,
      alignment: this.alignment.value,
      dockTopHeight: dockSizes.TOP,
      dockBottomHeight: dockSizes.BOTTOM,
      dockLeftWidth: dockSizes.LEFT,
      dockRightWidth: dockSizes.RIGHT,
      dropdowns: this.dropdowns.value.map((d) => ({
        id: d.id,
        title: d.title.value,
        options: d.options.value,
      })),
      access: this.access.value,
      invites: this.invites.value.map((i) => ({
        id: i.id,
        email: i.email,
        createdAt: i.createdAt,
      })),
    };
  }

  private recordUpdate(
    changes: PagePropertyChanges,
    inverse: PagePropertyChanges,
  ) {
    this.editor?.recordOperation({
      apply: { type: "page.setProperties", data: { changes } },
      reverse: { type: "page.setProperties", data: { changes: inverse } },
    });
  }

  getDropdown(id: string): Dropdown {
    const dropdown = this.dropdowns.value.find((d) => d.id === id);
    if (!dropdown) {
      throw new Error(`Dropdown cannot be found: ${id}`);
    }
    return dropdown;
  }

  getInvite(id: string): PageInvite {
    const invite = this.invites.value.find((i) => i.id === id);
    if (!invite) {
      throw new Error(`Invite cannot be found: ${id}`);
    }
    return invite;
  }

  async revokeAccess(userId: string) {
    await client.collaboration.revokePageAccess.mutate({
      pageId: this.id,
      userId,
    });
    this.access.value = this.access.value.filter(
      (access) => access.user.id !== userId,
    );
  }

  getTile(id: string): Tile;
  getTile<T extends Tile>(id: string, Expected: TileClass<T>): T;
  getTile(id: string, Expected?: TileClass) {
    const tile = this.index.get(id);
    if (!tile) {
      throw new Error(`Tile cannot be found: ${id}`);
    }
    if (Expected && !(tile instanceof Expected)) {
      throw new Error(
        // @ts-expect-error
        `Expected ${Expected.name} but got ${tile.constructor.name}`,
      );
    }
    return tile;
  }

  getSection(sectionId: string) {
    return this.getTile(sectionId, Section);
  }

  add(map: Y.Map<unknown>): Tile {
    const id = map.get("id") as string;
    let tile = this.index.get(id);
    if (!tile) {
      tile = createTileFromData(this, map);
      this.index.set(id, tile);
    }
    return tile;
  }

  /** Removes the tile from the page index. Idempotent. */
  remove(id: string) {
    this.index.delete(id);
  }

  createTile(
    map: Y.Map<unknown>,
    options: { parentId?: string | null; beforeId?: string | null } = {},
  ): Tile {
    const id = crypto.randomUUID();
    const parentId = options.parentId ?? null;
    const order = this.placement.orderBefore(parentId, options.beforeId);

    map.set("id", id);
    map.set("parentId", parentId);
    map.set("order", order);

    this.doc.transact(() => {
      this.doc.getMap<Y.Map<unknown>>("tiles").set(id, map);
    }, LOCAL_ORIGIN);

    return this.add(map);
  }

  private update(
    properties: Partial<{
      title: string;
      coverImageKey: string | null;
      font: FontId;
      backgroundColor: Color | null;
      published: boolean;
      folderId: string | null;
      width: number;
      alignment: HorizontalAlignment;
      dockTopHeight: number;
      dockBottomHeight: number;
      dockLeftWidth: number;
      dockRightWidth: number;
    }>,
  ) {
    return client.pages.update.mutate({
      pageId: this.id,
      ...properties,
    });
  }

  setTitle(title: string) {
    this.recordUpdate({ title }, { title: this.title.value });
    this.title.value = title;
    document.title = `${title} - Tiles`;
    return this.update({ title });
  }

  setCoverImage(imageKey: string | null) {
    return this.update({ coverImageKey: imageKey });
  }

  setFont(font: FontId) {
    this.recordUpdate({ font }, { font: this.font.value ?? undefined });
    this.font.value = font;
    return this.update({ font });
  }

  setPublished(published: boolean) {
    this.recordUpdate({ published }, { published: this.isPublished.value });
    this.isPublished.value = published;
    return this.update({ published });
  }

  setFolder(folderId: string | null) {
    this.recordUpdate({ folderId }, { folderId: this.folderId.value });
    this.folderId.value = folderId;
    return this.update({ folderId });
  }

  setTheme(theme: Theme | null) {
    this.doc.transact(() => {
      if (theme) {
        this.themes.apply(theme);
      }
      this.themeId.value = theme?.id ?? null;
    }, LOCAL_ORIGIN);
  }

  setWidth(width: number) {
    this.recordUpdate({ width }, { width: this.width.value });
    this.width.value = width;
    return this.update({ width });
  }

  setAlignment(alignment: HorizontalAlignment) {
    this.recordUpdate({ alignment }, { alignment: this.alignment.value });
    this.alignment.value = alignment;
    return this.update({ alignment });
  }

  setDockSizes(sizes: Partial<Record<DockEdge, number>>) {
    const prev = this.dockSizes.value;
    const changes = {
      dockTopHeight: sizes.TOP,
      dockBottomHeight: sizes.BOTTOM,
      dockLeftWidth: sizes.LEFT,
      dockRightWidth: sizes.RIGHT,
    };
    this.recordUpdate(changes, {
      dockTopHeight: sizes.TOP !== undefined ? prev.TOP : undefined,
      dockBottomHeight: sizes.BOTTOM !== undefined ? prev.BOTTOM : undefined,
      dockLeftWidth: sizes.LEFT !== undefined ? prev.LEFT : undefined,
      dockRightWidth: sizes.RIGHT !== undefined ? prev.RIGHT : undefined,
    });
    this.dockSizes.value = { ...prev, ...sizes };
    return this.update(changes);
  }

  delete() {
    return client.pages.delete.mutate({
      workspaceId: this.workspaceId,
      pageIds: [this.id],
    });
  }
}
