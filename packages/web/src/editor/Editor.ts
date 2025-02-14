import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { preloadImage, uploadMedia } from "@/utils/media";
import { isEditModeEnabled } from "@/utils/edit";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { Store, DerivedStore } from "@/utils/stores";
import type { FontId } from "@/config/fonts";
import type { Theme } from "@/types/pages";
import type { ImageModalResult } from "@/components/modals/ImageModal";
import type { ClientTile, ClientCollectionTile } from "@/types/tiles";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

const IS_SERVER = import.meta.env.SSR;

function getTilesByPlacementId(tiles: ClientTile[]) {
  return tiles.reduce((map, tile) => {
    map.set(tile.placementId, tile);
    if (tile.type === "COLLECTION") {
      tile.items.forEach((childItem) =>
        map.set(childItem.placementId, childItem),
      );
    }
    return map;
  }, new Map<string, ClientTile>());
}

export default class Editor {
  readonly pageId: string;
  readonly tiles: Store<ClientTile[]>;
  readonly tilesByPlacementId: DerivedStore<
    ClientTile[],
    Map<string, ClientTile>
  >;

  constructor(page: Page) {
    this.pageId = page.id;
    this.tiles = new Store(page.tiles);
    this.tilesByPlacementId = this.tiles.derive(getTilesByPlacementId);

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
          await this.createImage({ imageKey });
        },
      });
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await this.createLink({ url });
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
    if (tile.parentCollectionId) {
      this.tiles.value = this.tiles.value.map((t) =>
        t.type === "COLLECTION" && t.id === tile.parentCollectionId
          ? { ...t, items: t.items.concat(tile) }
          : t,
      );
    } else {
      this.tiles.value = this.tiles.value.concat(tile);
    }
  }

  removeTile(placementId: string) {
    this.tiles.value = this.tiles.value
      .filter((tile) => tile.placementId !== placementId)
      .map((tile) => {
        if (tile.type === "COLLECTION") {
          return {
            ...tile,
            items: tile.items.filter(
              (item) => item.placementId !== placementId,
            ),
          };
        }
        return tile;
      });
  }

  private updateTileData(
    tile: Omit<
      ClientTile,
      | "type"
      | "placementId"
      | "rows"
      | "columns"
      | "position"
      | "parentCollectionId"
    >,
  ) {
    this.tiles.value = this.tiles.value.map((entry) =>
      entry.id === tile.id ? { ...entry, ...tile } : entry,
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
    this.tiles.value = this.tiles.value
      .filter((item) => !data.tileIds?.includes(item.placementId))
      .concat(item);
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
    const tile = this.tilesByPlacementId.value.get(id);

    if (!tile) {
      throw new Error(`Invalid tile ID: ${id}`);
    }

    const fromCollectionId = tile.parentCollectionId;
    const tiles = Array.from(this.tiles.value);

    // Remove tile from old collection
    if (fromCollectionId) {
      const index = tiles.findIndex((t) => t.id === fromCollectionId);
      const collection = tiles[index] as ClientCollectionTile;
      tiles[index] = {
        ...collection,
        items: collection.items.filter((t) => t.id !== tile.id),
      };
    } else {
      const index = tiles.indexOf(tile);
      tiles.splice(index, 1);
    }

    // Add tile to new collection
    if (collectionId) {
      const index = tiles.findIndex((t) => t.id === collectionId);
      const collection = tiles[index] as ClientCollectionTile;
      const childIndex = afterId
        ? collection.items.findIndex((t) => t.placementId === afterId) + 1
        : 0;
      tiles[index] = {
        ...collection,
        items: collection.items.toSpliced(childIndex, 0, {
          ...tile,
          parentCollectionId: collectionId,
        }),
      };
    } else {
      const index = afterId
        ? tiles.findIndex((t) => t.placementId === afterId) + 1
        : 0;
      tiles.splice(index, 0, { ...tile, parentCollectionId: null });
    }

    this.tiles.value = tiles;
  }

  async resizeTilePreview({
    id,
    rows,
    columns,
  }: OmitPageId<AppRouterInputs["tiles"]["resize"]>) {
    this.tiles.value = this.tiles.value.map((t) =>
      t.id === id ? { ...t, columns, rows } : t,
    );
  }
}
