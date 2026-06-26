import client from "@/api/client";
import SharedList, { type SortOptions } from "@/collaboration/SharedList";
import { createId } from "doc/id";
import PageInvite from "@/models/PageInvite";
import PageThemes from "@/models/PageThemes";
import TileCollection from "@/models/TileCollection";
import TilePlacement from "@/models/TilePlacement";
import { dockParentId } from "@/models/parentId";
import Section from "@/models/Section";
import createTileFromData from "@/models/createTile";
import {
  LOCAL_ORIGIN,
  YMapBinding,
  type BoundField,
} from "@/collaboration/YMapBinding";
import { reactive, array, combine } from "@/utils/reactivity";
import { DEFAULT_DOCK_SIZE, DEFAULT_PAGE_WIDTH } from "@/constants/size";
import * as Y from "yjs";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";
import type { Color } from "@/utils/color";
import type { FontId } from "api/config/fonts";
import type { PageAccess } from "@/types/collaboration";
import type { Awareness } from "@/collaboration/types";
import type { DockEdge } from "doc/types/enums";
import type { HorizontalAlignment, PageType } from "api/types/pages";
import Dropdown from "@/models/Dropdown";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";

export type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type TileClass<T extends Tile = Tile> = abstract new (...args: any[]) => T;

const titleCollator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});
const SORT_BY_TITLE: SortOptions = {
  key: "title",
  compare: titleCollator.compare,
};

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
  readonly isPublished: Reactive<boolean>;
  readonly folderId: Reactive<string | null>;
  readonly themes: PageThemes;
  readonly themeId: Reactive<string | null>;
  readonly theme: Reactive<ThemeData | null>;
  readonly width: Reactive<number>;
  readonly alignment: Reactive<HorizontalAlignment>;
  readonly dockSizes: Record<DockEdge, BoundField<number>>;
  readonly dropdowns: SharedList<Dropdown>;
  private readonly dropdownsMap: Y.Map<Y.Map<unknown>>;
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
    this.isPublished = reactive(data.published);
    this.folderId = reactive(data.folderId);
    this.themes = new PageThemes(doc);
    this.metadataBinding = new YMapBinding(doc.getMap("metadata"));
    this.themeId = this.metadataBinding.field("themeId", null);
    this.backgroundColor = this.metadataBinding.field("backgroundColor", null);
    this.font = this.metadataBinding.field("font", null);
    this.width = this.metadataBinding.field("width", DEFAULT_PAGE_WIDTH);
    this.alignment = this.metadataBinding.field("alignment", "CENTER");
    this.theme = combine(
      { id: this.themeId, themes: this.themes },
      ({ id, themes }) => (id ? (themes.get(id) ?? null) : null),
    );
    this.dockSizes = {
      TOP: this.metadataBinding.field("dockTop", DEFAULT_DOCK_SIZE),
      BOTTOM: this.metadataBinding.field("dockBottom", DEFAULT_DOCK_SIZE),
      LEFT: this.metadataBinding.field("dockLeft", DEFAULT_DOCK_SIZE),
      RIGHT: this.metadataBinding.field("dockRight", DEFAULT_DOCK_SIZE),
    };
    this.dropdownsMap = this.doc.getMap<Y.Map<unknown>>("dropdowns");
    this.dropdowns = new SharedList(
      this.dropdownsMap,
      (id, map) => new Dropdown(id, map),
      SORT_BY_TITLE,
    );
    this.access = array(data.access);
    this.invites = array(data.invites.map((i) => new PageInvite(this, i)));
    this.index = new Map();
    this.placement = new TilePlacement(this);
  }

  get awareness(): Awareness | null {
    return this.editor?.collaboration?.awareness ?? null;
  }

  serialize(): Omit<PageData, "tiles" | "document"> {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      updatedAt: this.updatedAt.toISOString(),
      author: this.author,
      type: this.type,
      title: this.title.value,
      published: this.isPublished.value,
      folderId: this.folderId.value,
      access: this.access.value,
      invites: this.invites.value.map((i) => ({
        id: i.id,
        email: i.email,
        createdAt: i.createdAt,
      })),
    };
  }

  createDropdown(entry: Y.Map<unknown>): Dropdown {
    const id = createId();
    this.dropdownsMap.set(id, entry);
    return this.dropdowns.get(id);
  }

  getDropdown(id: string): Dropdown {
    return this.dropdowns.get(id);
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
    const id = createId();
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
      published: boolean;
      folderId: string | null;
    }>,
  ) {
    return client.pages.update.mutate({
      pageId: this.id,
      ...properties,
    });
  }

  setTitle(title: string) {
    this.title.value = title;
    document.title = `${title} - Tiles`;
    return this.update({ title });
  }

  setPublished(published: boolean) {
    this.isPublished.value = published;
    return this.update({ published });
  }

  setFolder(folderId: string | null) {
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

  delete() {
    return client.pages.delete.mutate({
      workspaceId: this.workspaceId,
      pageIds: [this.id],
    });
  }
}
