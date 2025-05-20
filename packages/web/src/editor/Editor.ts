import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { preloadImage, uploadMedia } from "@/utils/media";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { ReactiveValue, Computed, record } from "@/utils/reactivity";
import { scrollIntoView } from "@/utils/scroll";
import { isEditMode } from "@/utils/edit";
import type { FontId } from "@/config/fonts";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type {
  ClientTile,
  ClientCollection,
  Layout,
  LeafTile,
  Tile,
} from "@/types/tiles";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";
import type { PageInvite, PageAccess, User } from "@/types/collaboration";
import type { DragDropEvent } from "@/utils/drag";
import type { Color } from "@/utils/color";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

type TransitionFunction = (commit: () => void) => void;

function immediateTransition(commit: () => void) {
  commit();
}

const IS_SERVER = import.meta.env.SSR;

export function getTile(tile: ClientTile): Tile {
  const { id, placementId, type, ...properties } = tile;
  return {
    id,
    placementId,
    type,
    ...record(properties),
  } as Tile;
}

function getLayout(sections: ClientCollection[], tiles: Tile[]): Layout {
  return sections.map((section) => ({
    ...section,
    tiles: new ReactiveValue(
      tiles
        .filter((tile) => tile.parentCollectionId.value === section.id)
        .map((tile) =>
          tile.type === "COLLECTION"
            ? {
                ...tile,
                tiles: new ReactiveValue(
                  tiles.filter(
                    (t): t is LeafTile =>
                      t.type !== "COLLECTION" &&
                      t.parentCollectionId.value === tile.id,
                  ),
                ),
              }
            : tile,
        ),
    ),
  }));
}

export default class Editor {
  readonly pageId: string;
  readonly isEditable: ReactiveValue<boolean>;
  readonly title: ReactiveValue<string>;
  readonly subtitle: ReactiveValue<string | null>;
  readonly color: ReactiveValue<Color>;
  readonly coverImageUrl: ReactiveValue<string | null>;
  readonly isPublished: ReactiveValue<boolean>;
  readonly sections: ReactiveValue<ClientCollection[]>;
  readonly tiles: ReactiveValue<Tile[]>;
  readonly layout: Computed<[typeof this.sections, typeof this.tiles], Layout>;
  readonly access: ReactiveValue<PageAccess[]>;
  readonly invites: ReactiveValue<PageInvite[]>;
  readonly author: User;
  readonly focusedTile: ReactiveValue<string | null>;
  readonly dragId: ReactiveValue<string | null>;

  constructor(page: Page) {
    this.pageId = page.id;
    this.isEditable = new ReactiveValue(isEditMode());
    this.title = new ReactiveValue(page.title);
    this.subtitle = new ReactiveValue(page.subtitle);
    this.color = new ReactiveValue({
      l: page.lightness,
      c: page.chroma,
      h: page.hue,
    });
    this.coverImageUrl = new ReactiveValue(page.coverImageUrl);
    this.isPublished = new ReactiveValue(page.published);
    this.sections = new ReactiveValue(page.collections);
    this.tiles = new ReactiveValue(page.tiles.map(getTile));
    this.layout = new Computed([this.sections, this.tiles], getLayout);
    this.access = new ReactiveValue(page.access);
    this.invites = new ReactiveValue(page.invites);
    this.author = page.author;
    this.focusedTile = new ReactiveValue<string | null>(null);
    this.dragId = new ReactiveValue<string | null>(null);

    if (!IS_SERVER) {
      this.enableDragAndDrop();
    }
  }

  enableDragAndDrop() {
    document.addEventListener("dragover", this.dragOver.bind(this));
    document.addEventListener("drop", this.drop.bind(this));

    addEventListener(
      "dnd-dragstart",
      (event: DragDropEvent<Tile>) =>
        (this.dragId.value = event.state.data?.placementId ?? null),
      { passive: true },
    );
    addEventListener("dnd-dragend", () => (this.dragId.value = null));
  }

  private dragOver(event: DragEvent) {
    if (!this.isEditable.value || !event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer);

    if (item) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }

  private drop(event: DragEvent) {
    if (!this.isEditable.value || !event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer);
    if (!item) {
      return;
    }

    event.preventDefault();

    if (isImage(item)) {
      showModal<ImageModalResult>("IMAGE", {
        file: item.getAsFile(),
        onConfirm: async (result) => {
          const imageKey = await uploadMedia(result.image, "image");
          await this.createImage({
            collectionId: this.getCurrentCollectionId(),
            imageKey,
          });
        },
      });
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await this.createLink({
          collectionId: this.getCurrentCollectionId(),
          url,
        });
      });
    }
  }

  async setPageTitle(title?: string, subtitle?: string) {
    if (typeof title === "string") {
      this.title.value = title;
    }
    if (typeof subtitle === "string") {
      this.subtitle.value = subtitle;
    }
    return client.pages.update.mutate({
      pageId: this.pageId,
      title,
      subtitle,
    });
  }

  async setCoverImage(imageKey: string | null) {
    return client.pages.update.mutate({
      pageId: this.pageId,
      coverImageKey: imageKey,
    });
  }

  async setFont(font: FontId) {
    return client.pages.update.mutate({ pageId: this.pageId, font });
  }

  async setColor(color: Color) {
    return client.pages.update.mutate({
      pageId: this.pageId,
      color,
    });
  }

  async setPublished(published: boolean) {
    this.isPublished.value = published;
    return client.pages.update.mutate({ pageId: this.pageId, published });
  }

  async deletePage() {
    return client.pages.delete.mutate({ pageId: this.pageId });
  }

  getCurrentCollectionId() {
    const section = this.sections.value[0];
    if (!section) {
      throw new Error("Page has no sections");
    }
    return section.id;
  }

  // Sections

  async createSection(transition: TransitionFunction = immediateTransition) {
    const section = await client.sections.create.mutate({
      pageId: this.pageId,
    });
    transition(() => {
      this.sections.value = this.sections.value.concat(section);
    });
    return section;
  }

  async deleteSection(
    { id }: OmitPageId<AppRouterInputs["sections"]["delete"]>,
    transition: TransitionFunction = immediateTransition,
  ) {
    const section = await client.sections.delete.mutate({
      pageId: this.pageId,
      id,
    });
    transition(() => {
      this.sections.value = this.sections.value.filter(
        (section) => section.id !== id,
      );
    });
    return section;
  }

  async deleteTile(id: string, transition?: (commit: () => void) => void) {
    const result = await client.tiles.delete.mutate({
      pageId: this.pageId,
      id,
    });
    if (transition) {
      transition(() => this.removeTile(result.id));
    } else {
      this.removeTile(result.id);
    }
    return result;
  }

  async moveTile({
    id,
    collectionId,
    afterId,
  }: OmitPageId<AppRouterInputs["tiles"]["move"]>) {
    return client.tiles.move.mutate({
      pageId: this.pageId,
      id,
      collectionId,
      afterId,
    });
  }

  async resizeTile(id: string, columns: number, rows: number) {
    return client.tiles.resize.mutate({
      pageId: this.pageId,
      id,
      columns,
      rows,
    });
  }

  private addTile(tile: ClientTile) {
    this.tiles.value = this.tiles.value.concat(getTile(tile));
    scrollIntoView(tile.id);
  }

  removeTile(placementId: string) {
    this.tiles.value = this.tiles.value.filter(
      (tile) => tile.placementId !== placementId,
    );
    if (this.focusedTile.value === placementId) {
      this.focusedTile.value = null;
    }
  }

  private updateTileData(tile: Partial<Omit<ClientTile, "type">>) {
    this.tiles.value = this.tiles.value.map((entry) =>
      (tile.id && entry.id === tile.id) ||
      (tile.placementId && entry.placementId === tile.placementId)
        ? { ...entry, ...tile }
        : entry,
    );
  }

  // Text

  async createText(data: OmitPageId<AppRouterInputs["text"]["create"]>) {
    const item = await client.text.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async updateText(data: OmitPageId<AppRouterInputs["text"]["update"]>) {
    return await client.text.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Images

  async createImage(data: OmitPageId<AppRouterInputs["images"]["create"]>) {
    const item = await client.images.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    await preloadImage(item.imageUrl);
    this.addTile(item);
    return item;
  }

  async updateImage(data: OmitPageId<AppRouterInputs["images"]["update"]>) {
    return await client.images.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Links

  async createPageLink(
    data: OmitPageId<AppRouterInputs["pageLinks"]["create"]>,
  ) {
    const item = await client.pageLinks.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async createLink(
    data: OmitPageId<AppRouterInputs["externalLinks"]["create"]>,
  ) {
    const item = await client.externalLinks.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async updateLink(
    data: OmitPageId<AppRouterInputs["externalLinks"]["update"]>,
  ) {
    return await client.externalLinks.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Maps

  async createMap(data: OmitPageId<AppRouterInputs["maps"]["create"]>) {
    const item = await client.maps.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async addPlace(data: OmitPageId<AppRouterInputs["maps"]["addPlace"]>) {
    return await client.maps.addPlace.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async updatePlace(data: OmitPageId<AppRouterInputs["maps"]["updatePlace"]>) {
    return await client.maps.updatePlace.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async removePlace(data: OmitPageId<AppRouterInputs["maps"]["removePlace"]>) {
    return await client.maps.removePlace.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Tables

  async createTable(data: OmitPageId<AppRouterInputs["tables"]["create"]>) {
    const item = await client.tables.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async appendTableRow(
    data: OmitPageId<AppRouterInputs["tables"]["appendRow"]>,
  ) {
    const item = await client.tables.appendRow.mutate({
      pageId: this.pageId,
      ...data,
    });
    // TODO: Update tile data
    return item;
  }

  async deleteTableRow(
    data: OmitPageId<AppRouterInputs["tables"]["deleteRow"]>,
  ) {
    const item = await client.tables.deleteRow.mutate({
      pageId: this.pageId,
      ...data,
    });
    // TODO: Update tile data
    return item;
  }

  async updateTableCell(
    data: OmitPageId<AppRouterInputs["tables"]["updateCell"]>,
  ) {
    const item = await client.tables.updateCell.mutate({
      pageId: this.pageId,
      ...data,
    });
    // TODO: Update tile data
    return item;
  }

  // Videos

  async updateVideo(data: OmitPageId<AppRouterInputs["videos"]["update"]>) {
    return await client.videos.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Collections

  async createCollection(
    data: OmitPageId<AppRouterInputs["collections"]["create"]>,
  ) {
    const item = await client.collections.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    if (data.tileIds) {
      for (const placementId of data.tileIds) {
        this.updateTileData({ placementId, parentCollectionId: item.id });
      }
    }
    return item;
  }

  async moveTilePreview({
    id,
    collectionId,
    afterId,
  }: OmitPageId<AppRouterInputs["tiles"]["move"]>) {
    const tile = this.tiles.value.find((tile) => tile.id === id);
    if (!tile) {
      throw new Error(`Tile not found: ${id}`);
    }

    const index = this.tiles.value.indexOf(tile);
    const tiles = this.tiles.value.toSpliced(index, 1);

    if (afterId) {
      const afterIndex = tiles.findIndex(
        (tile) => tile.placementId === afterId,
      );
      if (afterIndex < 0) {
        throw new Error(`Tile not found: ${afterId}`);
      }
      tiles.splice(afterIndex + 1, 0, {
        ...tile,
        parentCollectionId: collectionId,
      });
    } else {
      tiles.splice(0, 0, { ...tile, parentCollectionId: collectionId });
    }

    this.tiles.value = tiles;
  }

  async resizeTilePreview({
    id,
    rows,
    columns,
  }: OmitPageId<AppRouterInputs["tiles"]["resize"]>) {
    const tile = this.tiles.value.find((entry) => entry.id === id);
    if (tile) {
      tile.rows.value = rows;
      tile.columns.value = columns;
    }
  }

  // Collaboration

  async sendInvite(email: string) {
    const invite = await client.collaboration.inviteToPage.mutate({
      pageId: this.pageId,
      email,
    });
    this.invites.value = this.invites.value.concat(invite);
  }

  async deleteInvite(
    id: string,
    transition: TransitionFunction = immediateTransition,
  ) {
    await client.collaboration.deletePageInvite.mutate({
      pageId: this.pageId,
      id,
    });
    transition(() => {
      this.invites.value = this.invites.value.filter(
        (invite) => invite.id !== id,
      );
    });
  }

  async revokeAccess(
    userId: string,
    transition: TransitionFunction = immediateTransition,
  ) {
    await client.collaboration.revokePageAccess.mutate({
      pageId: this.pageId,
      userId,
    });
    transition(() => {
      this.access.value = this.access.value.filter(
        (access) => access.user.id !== userId,
      );
    });
  }
}
