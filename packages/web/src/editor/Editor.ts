import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { preloadImage, uploadMedia } from "@/utils/media";
import { isEditModeEnabled } from "@/utils/edit";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { Store, DerivedStore } from "@/utils/stores";
import type { FontId } from "@/config/fonts";
import type { Theme } from "@/types/pages";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type { ClientTile, ClientCollection } from "@/types/tiles";
import type { Layout, LeafTile } from "@/types/layout";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

const IS_SERVER = import.meta.env.SSR;

function getLayout(sections: ClientCollection[], tiles: ClientTile[]): Layout {
  return sections.map((section) => ({
    ...section,
    tiles: tiles
      .filter((tile) => tile.parentCollectionId === section.id)
      .map((tile) =>
        tile.type === "COLLECTION"
          ? {
              ...tile,
              tiles: tiles.filter(
                (t): t is LeafTile =>
                  t.type !== "COLLECTION" && t.parentCollectionId === tile.id,
              ),
            }
          : tile,
      ),
  }));
}

export default class Editor {
  readonly pageId: string;
  readonly sections: Store<ClientCollection[]>;
  readonly tiles: Store<ClientTile[]>;
  readonly layout: DerivedStore<
    [typeof this.sections, typeof this.tiles],
    Layout
  >;

  constructor(page: Page) {
    this.pageId = page.id;
    this.sections = new Store(page.collections);
    this.tiles = new Store(page.tiles);
    this.layout = new DerivedStore([this.sections, this.tiles], getLayout);

    if (!IS_SERVER) {
      this.enableDragAndDrop();
    }
  }

  enableDragAndDrop() {
    document.addEventListener("dragover", this.dragOver.bind(this));
    document.addEventListener("drop", this.drop.bind(this));
  }

  private dragOver(event: DragEvent) {
    if (!isEditModeEnabled() || !event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer);

    if (item) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }

  private drop(event: DragEvent) {
    if (!isEditModeEnabled() || !event.dataTransfer) {
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

  async setTheme(theme: Theme, hue?: number | null) {
    return client.pages.update.mutate({ pageId: this.pageId, theme, hue });
  }

  async setPublished(published: boolean) {
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

  async createSection() {
    const section = await client.sections.create.mutate({
      pageId: this.pageId,
    });
    this.sections.value = this.sections.value.concat(section);
    return section;
  }

  async deleteSection({
    id,
  }: OmitPageId<AppRouterInputs["sections"]["delete"]>) {
    const section = await client.sections.delete.mutate({
      pageId: this.pageId,
      id,
    });
    this.sections.value = this.sections.value.filter(
      (section) => section.id !== id,
    );
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
    this.tiles.value = this.tiles.value.concat(tile);
  }

  removeTile(placementId: string) {
    this.tiles.value = this.tiles.value.filter(
      (tile) => tile.placementId !== placementId,
    );
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
    const item = await client.text.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
    return item;
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
    const item = await client.images.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
    return item;
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
    const item = await client.externalLinks.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
    return item;
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
    const result = await client.maps.addPlace.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(result);
    return result;
  }

  async updatePlace(data: OmitPageId<AppRouterInputs["maps"]["updatePlace"]>) {
    const result = await client.maps.updatePlace.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(result);
    return result;
  }

  async removePlace(data: OmitPageId<AppRouterInputs["maps"]["removePlace"]>) {
    const result = await client.maps.removePlace.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(result);
    return result;
  }

  // Events

  async createEvent(data: OmitPageId<AppRouterInputs["events"]["create"]>) {
    const item = await client.events.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async updateEvent(data: OmitPageId<AppRouterInputs["events"]["update"]>) {
    const item = await client.events.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
    return item;
  }

  // Videos

  async updateVideo(data: OmitPageId<AppRouterInputs["videos"]["update"]>) {
    const item = await client.videos.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
    return item;
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

  async updateCollection(
    data: OmitPageId<AppRouterInputs["collections"]["update"]>,
  ) {
    const item = await client.collections.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.updateTileData(item);
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
    this.tiles.value = this.tiles.value.map((entry) =>
      entry.id === id ? { ...entry, rows, columns } : entry,
    );
  }
}
