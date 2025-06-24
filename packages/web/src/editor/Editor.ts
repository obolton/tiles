import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { preloadImage, uploadMedia } from "@/utils/media";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { Computed, reactive, flag, record } from "@/utils/reactivity";
import { scrollIntoViewIfNeeded } from "@/utils/scroll";
import { isEditMode } from "@/utils/edit";
import type { FontId } from "@/config/fonts";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type {
  ClientTile,
  ClientCollection,
  Layout,
  Tile,
  Section,
} from "@/types/tiles";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";
import type { Invite, PageAccess, User } from "@/types/collaboration";
import type { DragDropEvent } from "@/utils/drag";
import type { Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

type TransitionFunction = (commit: () => void) => void;

function immediateTransition(commit: () => void) {
  commit();
}

const IS_SERVER = import.meta.env.SSR;

function getReactiveTile(tile: ClientTile): Tile {
  const { id, placementId, type, ...properties } = tile;
  return {
    id,
    placementId,
    type,
    ...record(properties),
  } as Tile;
}

function getReactiveSection(section: ClientCollection): Section {
  const { id, type, ...properties } = section;
  return {
    id,
    type,
    ...record(properties),
  };
}

function getLayout(sections: Section[], tiles: Tile[]): Layout {
  return sections.map((section) => ({
    ...section,
    tiles: reactive(
      tiles.filter((tile) => tile.parentCollectionId.value === section.id),
    ),
  }));
}

export default class Editor {
  readonly pageId: string;
  readonly isEditable: Reactive<boolean>;
  readonly title: Reactive<string>;
  readonly color: Reactive<Color>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly collections: Reactive<Section[]>;
  readonly tiles: Reactive<Tile[]>;
  readonly layout: Computed<
    [typeof this.collections, typeof this.tiles],
    Layout
  >;
  readonly access: Reactive<PageAccess[]>;
  readonly invites: Reactive<Invite[]>;
  readonly author: User;
  readonly focusedTile: Reactive<string | null>;
  readonly dragId: Reactive<string | null>;

  constructor(page: Page) {
    this.pageId = page.id;
    this.isEditable = flag(isEditMode());
    this.title = reactive(page.title);
    this.color = reactive(page.color);
    this.coverImageUrl = reactive(page.coverImageUrl);
    this.isPublished = reactive(page.published);
    this.collections = reactive(page.collections.map(getReactiveSection));
    this.tiles = reactive(page.tiles.map(getReactiveTile));
    this.layout = new Computed([this.collections, this.tiles], getLayout);
    this.access = reactive(page.access);
    this.invites = reactive(page.invites);
    this.author = page.author;
    this.focusedTile = reactive<string | null>(null);
    this.dragId = reactive<string | null>(null);

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

  async setPageTitle(title: string) {
    this.title.value = title;
    document.title = `${title} - Tiles`;
    return client.pages.update.mutate({
      pageId: this.pageId,
      title,
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
    const section = this.collections.value[0];
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
      this.collections.value = this.collections.value.concat(
        getReactiveSection(section),
      );
    });
    return section;
  }

  async updateSection(data: OmitPageId<AppRouterInputs["sections"]["update"]>) {
    return await client.sections.update.mutate({
      pageId: this.pageId,
      ...data,
    });
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
      this.collections.value = this.collections.value.filter(
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
  }: OmitPageId<AppRouterInputs["tiles"]["reorder"]>) {
    return client.tiles.reorder.mutate({
      pageId: this.pageId,
      id,
      collectionId,
      afterId,
    });
  }

  async resizeTile({
    id,
    width,
    height,
  }: OmitPageId<AppRouterInputs["tiles"]["resize"]>) {
    return client.tiles.resize.mutate({
      pageId: this.pageId,
      id,
      width,
      height,
    });
  }

  private addTile(tile: ClientTile) {
    this.tiles.value = this.tiles.value.concat(getReactiveTile(tile));

    const element = document.getElementById(tile.id);
    if (element) {
      element.focus({ preventScroll: true });
      scrollIntoViewIfNeeded(element, { behavior: "smooth" });
    }
  }

  removeTile(placementId: string) {
    this.tiles.value = this.tiles.value.filter(
      (tile) => tile.placementId !== placementId,
    );
    if (this.focusedTile.value === placementId) {
      this.focusedTile.value = null;
    }
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
    // Update the page title
    if (data.content) {
      const firstTextTileId = this.layout.value[0]?.tiles.value.find(
        (tile) => tile.type === "TEXT",
      )?.id;
      if (firstTextTileId && data.id === firstTextTileId) {
        const block = data.content.find(
          (node) =>
            (node.type === "heading" || node.type === "paragraph") &&
            node.children.length > 0,
        );
        const title = block?.children
          .filter((node) => node.type === "text")
          .map((node) => node.text)
          .join("")
          .slice(0, 100)
          .trim();

        if (title) {
          await this.setPageTitle(title);
        }
      }
    }

    return await client.text.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async write(data: OmitPageId<AppRouterInputs["ai"]["write"]>) {
    return client.ai.write.mutate(
      {
        pageId: this.pageId,
        ...data,
      },
      { context: { stream: true } },
    );
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
    return await client.tables.appendRow.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async deleteTableRow(
    data: OmitPageId<AppRouterInputs["tables"]["deleteRow"]>,
  ) {
    return await client.tables.deleteRow.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async appendTableColumn(
    data: OmitPageId<AppRouterInputs["tables"]["appendColumn"]>,
  ) {
    return await client.tables.appendColumn.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async updateTableColumn(
    data: OmitPageId<AppRouterInputs["tables"]["updateColumn"]>,
  ) {
    return await client.tables.updateColumn.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async deleteTableColumn(
    data: OmitPageId<AppRouterInputs["tables"]["deleteColumn"]>,
  ) {
    return await client.tables.deleteColumn.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async updateTableCell(
    data: OmitPageId<AppRouterInputs["tables"]["updateCell"]>,
  ) {
    return await client.tables.updateCell.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  // Videos

  async updateVideo(data: OmitPageId<AppRouterInputs["videos"]["update"]>) {
    return await client.videos.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async moveTilePreview({
    id,
    collectionId,
    afterId,
  }: OmitPageId<AppRouterInputs["tiles"]["reorder"]>) {
    const tile = this.tiles.value.find((tile) => tile.id === id);
    if (!tile) {
      throw new Error(`Tile not found: ${id}`);
    }

    const previousCollectionId = tile.parentCollectionId.value;

    const previousCollection = this.layout.value.find(
      (collection) => collection.id === previousCollectionId,
    );
    if (!previousCollection) {
      throw new Error(`Invalid collection ID: ${previousCollectionId}`);
    }

    const collection = this.layout.value.find((s) => s.id === collectionId);
    if (!collection) {
      throw new Error(`Invalid collection ID: ${collectionId}`);
    }

    // Remove tile from old position
    const previousIndex = previousCollection.tiles.value.indexOf(tile);
    if (previousIndex >= 0) {
      previousCollection.tiles.value = previousCollection.tiles.value.toSpliced(
        previousIndex,
        1,
      );
    }

    // Insert tile into new position
    const insertIndex = afterId
      ? collection.tiles.value.findIndex(
          (tile) => tile.placementId === afterId,
        ) + 1
      : 0;
    collection.tiles.value = collection.tiles.value.toSpliced(
      insertIndex,
      0,
      tile,
    );

    // Update reference to parent
    tile.parentCollectionId.value = collectionId;
  }

  async resizeTilePreview({
    id,
    width,
    height,
  }: OmitPageId<AppRouterInputs["tiles"]["resize"]>) {
    const tile = this.tiles.value.find((entry) => entry.id === id);
    if (tile) {
      if (typeof width === "number") {
        tile.width.value = width;
      }
      if (typeof height === "number") {
        tile.height.value = height;
      }
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
