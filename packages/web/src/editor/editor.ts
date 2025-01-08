import client from "@/api/client";
import type { FontId } from "@/config/fonts";
import type { Theme } from "@/types/pages";
import { showModal } from "@/utils/modals";
import type { ImageModalResult } from "@/components/modals/ImageModal";
import { preloadImage, uploadMedia } from "@/utils/media";
import { isEditModeEnabled } from "@/utils/edit";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import type { ClientTile } from "@/types/tiles";
import { Store } from "@/utils/stores";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

const IS_SERVER = import.meta.env.SSR;

export default class Editor {
  readonly pageId: string;
  readonly tiles: Store<ClientTile[]>;

  constructor(page: Page) {
    this.pageId = page.id;
    this.tiles = new Store(page.tiles);

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

  async moveTile(id: string, position: number) {
    return client.tiles.move.mutate({ pageId: this.pageId, id, position });
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

  private removeTile(placementId: string) {
    this.tiles.value = this.tiles.value.filter(
      (tile) => tile.placementId !== placementId,
    );
  }

  private updateTileData(
    tile: Omit<
      ClientTile,
      "type" | "placementId" | "rows" | "columns" | "position"
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
      .filter((item) => !data.tileIds.includes(item.placementId))
      .concat(item);
    return item;
  }
}
