import client from "@/api/client";
import Dropdown from "@/models/Dropdown";
import PageInvite from "@/models/PageInvite";
import TileCollection from "@/models/TileCollection";
import TilePlacement from "@/models/TilePlacement";
import { dockParentId } from "@/models/parentId";
import Section from "@/models/Section";
import Theme from "@/models/Theme";
import createTileFromData from "@/models/createTile";
import { reactive, array } from "@/utils/reactivity";
import type * as Y from "yjs";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type { Color } from "@/utils/color";
import type { FontId } from "api/config/fonts";
import type { PageAccess } from "@/types/collaboration";
import type { Awareness } from "@/collaboration/types";
import type { PagePropertyChanges } from "@/operations";
import type { DockEdge, ClientTile } from "api/types/tiles";
import type { HorizontalAlignment, PageType } from "api/types/pages";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";

export type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type TileClass<T extends Tile = Tile> = abstract new (...args: any[]) => T;

export default class Page {
  editor?: Editor;

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
  readonly theme: Reactive<Theme | null>;
  readonly width: Reactive<number>;
  readonly alignment: Reactive<HorizontalAlignment>;
  readonly dockSizes: Reactive<Record<DockEdge, number>>;
  readonly dropdowns: ReactiveArray<Dropdown>;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<PageInvite>;
  readonly index: Map<string, Tile>;
  readonly placement: TilePlacement;

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

  constructor(data: PageData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.updatedAt = new Date(data.updatedAt);
    this.author = data.author;
    this.type = data.type;
    this.title = reactive(data.title);
    this.backgroundColor = reactive(data.backgroundColor);
    this.font = reactive(data.font);
    this.coverImageUrl = reactive(data.coverImageUrl);
    this.isPublished = reactive(data.published);
    this.folderId = reactive(data.folderId);
    this.theme = reactive(data.theme ? new Theme(data.theme) : null);
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

  get doc(): Y.Doc | null {
    return this.editor?.collaboration?.doc ?? null;
  }

  get awareness(): Awareness | null {
    return this.editor?.collaboration?.awareness ?? null;
  }

  serialize(): Omit<PageData, "tiles"> {
    const dockSizes = this.dockSizes.value;
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      updatedAt: this.updatedAt.toISOString(),
      author: this.author,
      type: this.type,
      title: this.title.value,
      backgroundColor: this.backgroundColor.value,
      font: this.font.value,
      coverImageUrl: this.coverImageUrl.value,
      published: this.isPublished.value,
      folderId: this.folderId.value,
      theme: this.theme.value?.serialize() ?? null,
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

  createTile(properties: ClientTile): Tile {
    return createTileFromData(this, properties);
  }

  initTiles(tiles: ClientTile[]) {
    this.placement.bootstrap(tiles);
  }

  private update(
    properties: Partial<{
      title: string;
      coverImageKey: string | null;
      font: FontId;
      backgroundColor: Color | null;
      published: boolean;
      folderId: string | null;
      themeId: string | null;
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

  setBackgroundColor(backgroundColor: Color | null) {
    this.recordUpdate(
      { backgroundColor },
      { backgroundColor: this.backgroundColor.value },
    );
    this.backgroundColor.value = backgroundColor;
    return this.update({ backgroundColor });
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
    const themeId = theme?.id ?? null;
    this.recordUpdate({ themeId }, { themeId: this.theme.value?.id ?? null });
    this.theme.value = theme;
    return this.update({ themeId });
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
