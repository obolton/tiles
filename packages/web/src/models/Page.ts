import client from "@/api/client";
import SharedList, { type SortOptions } from "@/collaboration/SharedList";
import { createId } from "doc/id";
import PageInvite from "@/models/PageInvite";
import PageThemes from "@/models/PageThemes";
import TileCollection from "@/models/TileCollection";
import TilePlacement, { type TileRemovalCallback } from "@/models/TilePlacement";
import Body from "@/models/Body";
import { dockParentId } from "@/models/parentId";
import Section from "@/models/Section";
import createTileFromData from "@/models/createTile";
import { YMapBinding, type BoundField } from "@/collaboration/YMapBinding";
import { reactive, array, combine } from "reactivity";
import { DEFAULT_DOCK_SIZE, DEFAULT_PAGE_WIDTH, FULL_PAGE_WIDTH } from "@/constants/size";
import * as Y from "yjs";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "reactivity";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";
import type { PageAccess } from "@/types/collaboration";
import type { DockEdge, HorizontalAlignment } from "doc/types/enums";
import type { PageType } from "api/types/pages";
import Dropdown from "@/models/Dropdown";
import type Tile from "@/models/Tile";
import type { TileContainer, TilePlacementInput } from "@/models/TileContainer";
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
  readonly isPublished: Reactive<boolean>;
  readonly folderId: Reactive<string | null>;
  readonly themes: PageThemes;
  readonly themeId: Reactive<string | null>;
  readonly theme: Reactive<ThemeData | null>;
  /** The page width in grid units, where a column count is needed; a full-width page stretches in CSS. */
  readonly width: Reactive<number>;
  /** The stored page width: a column count, or {@link FULL_PAGE_WIDTH}. */
  readonly widthSetting: BoundField<number>;
  readonly isFullWidth: Reactive<boolean>;
  readonly alignment: Reactive<HorizontalAlignment>;
  readonly dockSizes: Record<DockEdge, BoundField<number>>;
  readonly dropdowns: SharedList<Dropdown>;
  private readonly dropdownsMap: Y.Map<Y.Map<unknown>>;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<PageInvite>;
  readonly index: Map<string, Tile>;
  /** The rich text body of a document page, hosting its embedded tiles. */
  readonly body: Body | null;
  readonly placement: TilePlacement;
  private readonly metadataBinding: YMapBinding;

  /** The page-root tiles, as a controller-maintained order-sorted view. */
  get tiles(): TileCollection {
    return this.placement.getCollection(null);
  }

  /** The docked tiles per edge, as controller-maintained views. */
  get dockedTiles(): Record<"TOP" | "LEFT" | "RIGHT" | "BOTTOM", TileCollection> {
    return {
      TOP: this.placement.getCollection(dockParentId("TOP")),
      LEFT: this.placement.getCollection(dockParentId("LEFT")),
      RIGHT: this.placement.getCollection(dockParentId("RIGHT")),
      BOTTOM: this.placement.getCollection(dockParentId("BOTTOM")),
    };
  }

  constructor(data: PageData, doc: Y.Doc, onTilesRemoved?: TileRemovalCallback) {
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
    this.widthSetting = this.metadataBinding.field("width", DEFAULT_PAGE_WIDTH);
    this.isFullWidth = this.widthSetting.derive((width) => width === FULL_PAGE_WIDTH);
    this.width = this.widthSetting.derive((width) =>
      width === FULL_PAGE_WIDTH ? DEFAULT_PAGE_WIDTH : width,
    );
    this.alignment = this.metadataBinding.field("alignment", "CENTER");
    this.theme = combine({ id: this.themeId, themes: this.themes }, ({ id, themes }) =>
      id ? (themes.get(id) ?? null) : null,
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
    this.body = data.type === "DOCUMENT" ? new Body(this) : null;
    this.placement = new TilePlacement(this, onTilesRemoved);
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
    this.access.value = this.access.value.filter((access) => access.user.id !== userId);
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

  getTiles(ids: Iterable<string>): Tile[] {
    return Array.from(ids).flatMap((id) => this.index.get(id) ?? []);
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

  /** The width for a new tile spanning its container; root tiles of a full-width page stretch instead. */
  spanningWidth(parentId: string | null = null): number | null {
    return parentId === null && this.isFullWidth.value ? null : this.width.value;
  }

  /** The container for a parent: the body for root tiles of a document page, else a collection. */
  container(parentId: string | null): TileContainer {
    return parentId === null && this.body ? this.body : this.placement;
  }

  createTile(map: Y.Map<unknown>, placement: TilePlacementInput = {}): Tile {
    const id = createId();
    map.set("id", id);
    return this.container(placement.parentId ?? null).insert(id, map, placement);
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
    const previousId = this.themeId.value;
    this.doc.transact(() => {
      if (theme) {
        this.themes.apply(theme);
      }
      this.themeId.value = theme?.id ?? null;
      if (previousId) {
        this.pruneTheme(previousId);
      }
    });
  }

  /** Removes a theme snapshot that neither the page nor any tile references any more. */
  pruneTheme(id: string) {
    if (this.themeId.value === id) {
      return;
    }
    for (const tile of this.index.values()) {
      if (tile.themeId.value === id) {
        return;
      }
    }
    this.themes.delete(id);
  }

  delete() {
    return client.pages.delete.mutate({
      workspaceId: this.workspaceId,
      pageIds: [this.id],
    });
  }
}
