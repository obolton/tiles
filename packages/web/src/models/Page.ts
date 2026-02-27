import client from "@/api/client";
import Dropdown from "@/models/Dropdown";
import PageInvite from "@/models/PageInvite";
import TileCollection from "@/models/TileCollection";
import Section from "@/models/Section";
import createTileFromData from "@/models/createTile";
import { reactive, array } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type { Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { User, PageAccess } from "@/types/collaboration";
import type { DockEdge, ClientTile } from "api/types/tiles";
import type { HorizontalAlignment } from "api/types/pages";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";

export type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type TileClass<T extends Tile = Tile> = abstract new (...args: any[]) => T;

export default class Page {
  editor?: Editor;

  readonly id: string;
  readonly workspaceId: string;
  readonly author: User;
  readonly title: Reactive<string>;
  readonly backgroundColor: Reactive<Color | null>;
  readonly font: Reactive<FontId | null>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly folderId: Reactive<string | null>;
  readonly themeId: Reactive<string | null>;
  readonly width: Reactive<number>;
  readonly alignment: Reactive<HorizontalAlignment>;
  readonly dockSizes: Reactive<Record<DockEdge, number | null>>;
  readonly dropdowns: ReactiveArray<Dropdown>;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<PageInvite>;
  readonly index: Map<string, Tile>;
  readonly tiles: TileCollection;
  readonly dockedTiles: {
    TOP: TileCollection;
    LEFT: TileCollection;
    RIGHT: TileCollection;
    BOTTOM: TileCollection;
  };

  constructor(data: PageData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.author = data.author;
    this.title = reactive(data.title);
    this.backgroundColor = reactive(data.backgroundColor);
    this.font = reactive(data.font);
    this.coverImageUrl = reactive(data.coverImageUrl);
    this.isPublished = reactive(data.published);
    this.folderId = reactive(data.folderId);
    this.themeId = reactive(data.theme?.id ?? null);
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
    this.tiles = new TileCollection();
    this.dockedTiles = {
      TOP: new TileCollection(),
      LEFT: new TileCollection(),
      RIGHT: new TileCollection(),
      BOTTOM: new TileCollection(),
    };
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

  createTile(properties: ClientTile): Tile {
    return createTileFromData(this, properties);
  }

  initTiles(tiles: ClientTile[]) {
    const parentIds = new Map<string, string | null>();

    for (const tile of tiles) {
      const object = createTileFromData(this, tile);
      this.index.set(object.id, object);
      if (tile.sectionId) {
        parentIds.set(object.id, tile.sectionId);
      }
    }

    for (const item of this.index.values()) {
      const dock = item.dock.value;
      if (dock) {
        this.dockedTiles[dock].append(item);
      } else {
        const parentId = parentIds.get(item.id);
        if (parentId) {
          this.getSection(parentId).tiles.append(item);
        } else {
          this.tiles.append(item);
        }
      }
    }
  }

  private update(
    properties: Partial<{
      title: string;
      coverImageKey: string | null;
      font: FontId;
      backgroundColor: Color;
      published: boolean;
      folderId: string | null;
      themeId: string | null;
      width: number;
      alignment: HorizontalAlignment;
      dockTopHeight: number | null;
      dockBottomHeight: number | null;
      dockLeftWidth: number | null;
      dockRightWidth: number | null;
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

  setCoverImage(imageKey: string | null) {
    return this.update({ coverImageKey: imageKey });
  }

  setFont(font: FontId) {
    return this.update({ font });
  }

  setBackgroundColor(backgroundColor: Color) {
    return this.update({ backgroundColor });
  }

  setPublished(published: boolean) {
    this.isPublished.value = published;
    return this.update({ published });
  }

  setFolder(folderId: string | null) {
    this.folderId.value = folderId;
    return this.update({ folderId });
  }

  setTheme(themeId: string | null) {
    this.themeId.value = themeId;
    return this.update({ themeId });
  }

  setWidth(width: number) {
    this.width.value = width;
    return this.update({ width });
  }

  setAlignment(alignment: HorizontalAlignment) {
    this.alignment.value = alignment;
    return this.update({ alignment });
  }

  setDockSizes(sizes: Partial<Record<DockEdge, number | null>>) {
    this.dockSizes.value = { ...this.dockSizes.value, ...sizes };
    return this.update({
      dockTopHeight: sizes.TOP,
      dockBottomHeight: sizes.BOTTOM,
      dockLeftWidth: sizes.LEFT,
      dockRightWidth: sizes.RIGHT,
    });
  }

  delete() {
    return client.pages.delete.mutate({
      workspaceId: this.workspaceId,
      pageIds: [this.id],
    });
  }
}
