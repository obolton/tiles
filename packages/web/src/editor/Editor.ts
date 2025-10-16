import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { preloadImage, uploadMedia } from "@/utils/media";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { reactive, flag, record, array } from "@/utils/reactivity";
import { scrollIntoViewIfNeeded } from "@/utils/scroll";
import { focusInside } from "@/utils/focus";
import { isEditMode } from "@/utils/edit";
import { createState } from "@/utils/richText/state";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { moveElement } from "@/utils/arrays";
import Text from "@/items/Text";
import Image from "@/items/Image";
import Video from "@/items/Video";
import Link from "@/items/Link";
import PageLink from "@/items/PageLink";
import Map from "@/items/Map";
import Table from "@/items/Table";
import Chart from "@/items/Chart";
import type { FontId } from "@/config/fonts";
import type { ClientTile, ClientCollection } from "api/src/types/tiles";
import type { Tile, SectionWithTiles } from "@/types/tiles";
import type { Dropdown } from "@/types/dropdowns";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";
import type { Invite, PageAccess, User } from "@/types/collaboration";
import type { Color } from "@/utils/color";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

type TransitionFunction = (commit: () => void) => void;

function immediateTransition(commit: () => void) {
  commit();
}

const IS_SERVER = import.meta.env.SSR;

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");

function getReactiveTile(editor: Editor, tile: ClientTile): Tile {
  switch (tile.type) {
    case "TEXT":
      return new Text(editor, tile);
    case "IMAGE":
      return new Image(editor, tile);
    case "VIDEO":
      return new Video(editor, tile);
    case "LINK":
      return new Link(editor, tile);
    case "PAGE_LINK":
      return new PageLink(editor, tile);
    case "MAP":
      return new Map(editor, tile);
    case "TABLE":
      return new Table(editor, tile);
    case "CHART":
      return new Chart(editor, tile);
    default: {
      throw new Error(`Invalid tile type: ${tile.type}`);
    }
  }
}

// TODO: Make a method of Editor
function getReactiveSection(
  section: ClientCollection,
  tiles: Reactive<Tile[]>,
): SectionWithTiles {
  const { id, ...properties } = section;
  return {
    id,
    ...record(properties),
    tiles: tiles.derive((tiles) =>
      tiles.filter((tile) => tile.sectionId.value === section.id),
    ),
  };
}

export default class Editor {
  static #current?: Editor;

  readonly pageId: string;
  readonly workspaceId: string;
  readonly isEditable: Reactive<boolean>;
  readonly title: Reactive<string>;
  readonly color: Reactive<Color>;
  readonly font: Reactive<FontId>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly sections: ReactiveArray<SectionWithTiles>;
  readonly tiles: Reactive<Tile[]>;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<Invite>;
  readonly author: User;
  readonly selection: Reactive<Set<Tile>>;
  readonly dropdowns: ReactiveArray<Dropdown>;

  activeSection: SectionWithTiles | null = null;

  static init(page: Page) {
    if (this.#current) {
      throw new Error("The editor has already been initialized");
    }

    const editor = new Editor(page);

    if (!import.meta.env.SSR) {
      this.#current = editor;
    }

    return editor;
  }

  static get current() {
    if (import.meta.env.SSR) {
      throw new Error("Requires browser context");
    }

    if (!this.#current) {
      throw new Error("The editor has not been initialized");
    }

    return this.#current;
  }

  private constructor(page: Page) {
    this.pageId = page.id;
    this.workspaceId = page.workspaceId;
    this.isEditable = flag(isEditMode());
    this.title = reactive(page.title);
    this.color = reactive(page.color);
    this.font = reactive(page.font);
    this.coverImageUrl = reactive(page.coverImageUrl);
    this.isPublished = reactive(page.published);
    this.tiles = reactive(
      page.tiles.map((properties) => getReactiveTile(this, properties)),
    );
    this.sections = array(
      page.sections.map((section) => getReactiveSection(section, this.tiles)),
    );
    this.access = array(page.access);
    this.invites = array(page.invites);
    this.author = page.author;
    this.selection = reactive(new Set());
    this.dropdowns = array(page.dropdowns);

    if (!IS_SERVER) {
      this.enablePointerEvents();
    }
  }

  enablePointerEvents() {
    document.addEventListener("pointerdown", this.pointerDown.bind(this), {
      passive: true,
    });
    document.addEventListener("keydown", this.keyDown.bind(this));
    document.addEventListener("dragover", this.dragOver.bind(this));
    document.addEventListener("drop", this.drop.bind(this));
  }

  private pointerDown(event: PointerEvent) {
    if (event.button === PRIMARY_MOUSE_BUTTON && !event.defaultPrevented) {
      this.clearSelection();
    }
  }

  private keyDown(event: KeyboardEvent) {
    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      !event.repeat &&
      event.target instanceof HTMLElement &&
      event.target.tagName !== "INPUT" &&
      event.target.tagName !== "TEXTAREA" &&
      !event.target.closest(":popover-open") &&
      !event.target.isContentEditable &&
      this.selection.value.size > 0
    ) {
      event.preventDefault();
      this.deleteSelection();
    }
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
      const file = item.getAsFile();
      if (file) {
        showModal(ImageModalLoader, {
          props: { file },
          onConfirm: async (result) => {
            const imageKey = await uploadMedia({
              file: result.image,
              type: "image",
              workspaceId: this.workspaceId,
            });
            await this.createImage({
              sectionId: this.getCurrentSectionId(),
              imageKey,
            });
          },
        });
      }
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await this.createLink({
          sectionId: this.getCurrentSectionId(),
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

  getCurrentSectionId() {
    const id = this.activeSection?.id ?? this.sections.value.at(-1)?.id;

    if (!id) {
      throw new Error("Page has no sections");
    }

    return id;
  }

  // Selection

  select(ids: string[], extendSelection = false) {
    const tiles = new Set(ids.map((id) => this.getTile(id)));
    if (extendSelection) {
      if (tiles.size === 0) {
        return;
      }
      this.selection.value = this.selection.value.union(tiles);
    } else {
      this.selection.value = tiles;
    }
  }

  deselect(ids: string[]) {
    const tiles = new Set(ids.map((id) => this.getTile(id)));
    this.selection.value = this.selection.value.difference(tiles);
  }

  clearSelection() {
    if (this.selection.value.size > 0) {
      this.selection.value = new Set();
    }
  }

  deleteSelection() {
    if (this.selection.value.size === 0) {
      return;
    }

    const ids = Array.from(
      this.selection.value.values().map((tile) => tile.placementId),
    );

    this.clearSelection();
    this.deleteTiles(ids);
  }

  // Sections

  async createSection(data: OmitPageId<AppRouterInputs["sections"]["create"]>) {
    const section = await client.sections.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    viewTransition(() => {
      const afterIndex = data.afterSectionId
        ? (this.sections.value.findIndex(
            (section) => section.id === data.afterSectionId,
          ) ?? -1)
        : -1;
      this.sections.value = this.sections.value.toSpliced(
        afterIndex + 1,
        0,
        getReactiveSection(section, this.tiles),
      );

      const element = document.querySelector<HTMLElement>(
        `[data-section-id="${section.id}"]`,
      );
      if (element) {
        element.focus({ preventScroll: true });
        scrollIntoViewIfNeeded(element, { behavior: "smooth" });
      }
    });

    return section;
  }

  async updateSection(data: OmitPageId<AppRouterInputs["sections"]["update"]>) {
    return await client.sections.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async duplicateSection(
    data: OmitPageId<AppRouterInputs["sections"]["duplicate"]>,
  ) {
    return await client.sections.duplicate.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  transitionSections(update: () => void) {
    const sections = document.querySelectorAll<HTMLElement>(
      "section[data-section-id]",
    );
    for (const section of sections) {
      section.style.viewTransitionName = `section-${section.dataset.sectionId}`;
    }
    viewTransition(update).updateCallbackDone.finally(() => {
      for (const section of sections) {
        section.style.viewTransitionName = "";
      }
    });
  }

  async deleteSection({
    id,
  }: OmitPageId<AppRouterInputs["sections"]["delete"]>) {
    const section = await client.sections.delete.mutate({
      pageId: this.pageId,
      id,
    });

    const element = document.querySelector<HTMLElement>(
      `section[data-section-id="${id}"]`,
    );
    if (element) {
      element.style.viewTransitionClass = "destroy";
    }
    const sibling =
      element?.nextElementSibling || element?.previousElementSibling;

    this.transitionSections(() => {
      this.sections.value = this.sections.value.filter(
        (section) => section.id !== id,
      );
      if (sibling instanceof HTMLElement) {
        sibling.focus({ preventScroll: true });
      }
    });

    return section;
  }

  async moveSectionUp(id: string) {
    const index = this.sections.value.findIndex((section) => section.id === id);
    if (index < 0) {
      throw new Error(`Invalid section ID: ${id}`);
    }
    if (index === 0) {
      return;
    }

    const afterSectionId = this.sections.value[index - 2]?.id ?? null;

    this.transitionSections(() => {
      this.sections.value = moveElement(this.sections.value, index, index - 1);
    });

    await client.sections.update.mutate({
      pageId: this.pageId,
      id,
      afterSectionId,
    });
  }

  async moveSectionDown(id: string) {
    const index = this.sections.value.findIndex((section) => section.id === id);
    if (index < 0) {
      throw new Error(`Invalid section ID: ${id}`);
    }

    const afterSectionId = this.sections.value[index + 1]?.id;
    if (!afterSectionId) {
      return;
    }

    this.transitionSections(() => {
      this.sections.value = moveElement(this.sections.value, index, index + 1);
    });

    await client.sections.update.mutate({
      pageId: this.pageId,
      id,
      afterSectionId,
    });
  }

  // Tiles

  getTile(id: string) {
    const tile = this.tiles.value.find((tile) => tile.id === id);
    if (!tile) {
      throw new Error(`Invalid tile ID: ${id}`);
    }
    return tile;
  }

  async deleteTiles(ids: string[]) {
    await client.tiles.delete.mutate({
      pageId: this.pageId,
      ids,
    });

    const items = document.getElementsByTagName("page-item");
    for (const item of items) {
      if (item.id) {
        item.style.viewTransitionName = `item-${item.id}`;
      }
    }

    const elements = ids
      .map((id) =>
        document.querySelector<HTMLElement>(
          `page-item[data-placement-id="${id}"]`,
        ),
      )
      .filter((element) => !!element);
    elements.forEach((element) => {
      element.style.viewTransitionClass = "destroy";
    });

    // If the focus was in a tile to be deleted, move focus to a new element
    let focus: Element | null = null;
    const containsFocus = !!elements.find((element) =>
      element.contains(document.activeElement),
    );
    if (containsFocus) {
      const last = elements.at(-1);
      focus =
        (last?.nextElementSibling || last?.previousElementSibling) ?? null;
    }

    viewTransition(() => {
      this.removeTiles(ids);

      if (focus instanceof HTMLElement) {
        focusInside(focus, { preventScroll: true });
        scrollIntoViewIfNeeded(focus, { behavior: "smooth" });
      }
    }).updateCallbackDone.finally(() => {
      for (const item of items) {
        item.style.viewTransitionName = "";
      }
    });
  }

  async moveTile({
    id,
    sectionId,
    afterId,
  }: OmitPageId<AppRouterInputs["tiles"]["reorder"]>) {
    return client.tiles.reorder.mutate({
      pageId: this.pageId,
      id,
      sectionId,
      afterId,
    });
  }

  async positionTile({
    id,
    sectionId,
    x,
    y,
    width,
    height,
    block,
  }: OmitPageId<AppRouterInputs["tiles"]["update"]>) {
    const tile = this.tiles.value.find((tile) => tile.placementId === id);
    if (!tile) {
      throw new Error(`Tile not found: ${id}`);
    }

    // Move tile to new section
    if (sectionId) {
      const section = this.sections.value.find((s) => s.id === sectionId);
      if (!section) {
        throw new Error(`Invalid section ID: ${sectionId}`);
      }

      const previousSection = this.sections.value.find(
        (s) => s.id === tile.sectionId.value,
      );

      tile.sectionId.value = sectionId;
      section.tiles.markAsStale();
      previousSection?.tiles.markAsStale();
    }

    if (typeof x === "number") {
      tile.x.value = x;
    }
    if (typeof y === "number") {
      tile.y.value = y;
    }
    if (typeof width === "number") {
      tile.width.value = width;
    }
    if (typeof height === "number") {
      tile.height.value = height;
    }
    if (typeof block === "boolean") {
      tile.block.value = block;
    }

    await client.tiles.update.mutate({
      pageId: this.pageId,
      id,
      sectionId,
      x,
      y,
      width,
      height,
      block,
    });
  }

  addTile(tile: ClientTile, select = true) {
    viewTransition(() => {
      this.tiles.value = this.tiles.value.concat(getReactiveTile(this, tile));
    }).updateCallbackDone.then(() => {
      if (select) {
        this.select([tile.id]);

        const element = document.getElementById(tile.id);
        if (element) {
          focusInside(element, { preventScroll: true });
          scrollIntoViewIfNeeded(element, { behavior: "smooth" });
        }
      }
    });
  }

  removeTiles(placementIds: string[]) {
    const ids = new Set(placementIds);
    this.tiles.value = this.tiles.value.filter(
      (tile) => !ids.has(tile.placementId),
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

  // TODO: Restore title setting
  async updateText(data: OmitPageId<AppRouterInputs["text"]["update"]>) {
    // Update the page title
    if (data.content) {
      const firstTextTileId = this.sections.value[0]?.tiles.value.find(
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

  getTextEditorState(id: string) {
    const tile = this.tiles.value.find(
      (entry): entry is Text => entry.type === "TEXT" && entry.id === id,
    );
    if (!tile) {
      throw new Error(`Invalid text tile ID: ${id}`);
    }
    if (!tile.state.value) {
      tile.state.value = createState(tile.content.value);
    }
    return tile.state;
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

  async addPlaces(data: OmitPageId<AppRouterInputs["maps"]["addPlaces"]>) {
    return await client.maps.addPlaces.mutate({
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

  async updateTable(data: OmitPageId<AppRouterInputs["tables"]["update"]>) {
    return await client.tables.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async insertTableRow(
    data: OmitPageId<AppRouterInputs["tables"]["insertRow"]>,
  ) {
    return await client.tables.insertRow.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async moveTableRow(data: OmitPageId<AppRouterInputs["tables"]["moveRow"]>) {
    return await client.tables.moveRow.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async deleteTableRows(
    data: OmitPageId<AppRouterInputs["tables"]["deleteRows"]>,
  ) {
    return await client.tables.deleteRows.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async insertTableColumn(
    data: OmitPageId<AppRouterInputs["tables"]["insertColumn"]>,
  ) {
    return await client.tables.insertColumn.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async moveTableColumn(
    data: OmitPageId<AppRouterInputs["tables"]["moveColumn"]>,
  ) {
    return await client.tables.moveColumn.mutate({
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

  async deleteTableColumns(
    data: OmitPageId<AppRouterInputs["tables"]["deleteColumns"]>,
  ) {
    return await client.tables.deleteColumns.mutate({
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

  async clearTableRanges(
    data: OmitPageId<AppRouterInputs["tables"]["clearRanges"]>,
  ) {
    return await client.tables.clearRanges.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  getTableColumnData(tableId: string, columnId: string) {
    const table = this.tiles.value.find(
      (tile): tile is Table => tile.type === "TABLE" && tile.id === tableId,
    );
    if (!table) {
      throw new Error(`Invalid table ID: ${tableId}`);
    }
    return table.rows.derive((rows) =>
      rows.map((row) => row.data[columnId] ?? null),
    );
  }

  getTable(tableId: string) {
    const table = this.tiles.value.find(
      (tile): tile is Table => tile.type === "TABLE" && tile.id === tableId,
    );
    if (!table) {
      throw new Error(`Invalid table ID: ${tableId}`);
    }
    return table;
  }

  // Charts

  async createChart(data: OmitPageId<AppRouterInputs["charts"]["create"]>) {
    const item = await client.charts.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.addTile(item);
    return item;
  }

  async updateChart(data: OmitPageId<AppRouterInputs["charts"]["update"]>) {
    return await client.charts.update.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async addChartSeries(
    data: OmitPageId<AppRouterInputs["charts"]["addSeries"]>,
  ) {
    return await client.charts.addSeries.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async updateChartSeries(
    data: OmitPageId<AppRouterInputs["charts"]["updateSeries"]>,
  ) {
    return await client.charts.updateSeries.mutate({
      pageId: this.pageId,
      ...data,
    });
  }

  async deleteChartSeries(
    data: OmitPageId<AppRouterInputs["charts"]["deleteSeries"]>,
  ) {
    return await client.charts.deleteSeries.mutate({
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

  positionTilePreview({
    id,
    x,
    y,
    width,
    height,
    block,
  }: OmitPageId<AppRouterInputs["tiles"]["update"]>) {
    const tile = this.tiles.value.find((entry) => entry.placementId === id);
    if (tile) {
      if (typeof x === "number") {
        tile.x.value = x;
      }
      if (typeof y === "number") {
        tile.y.value = y;
      }
      if (typeof width === "number") {
        tile.width.value = width;
      }
      if (typeof height === "number") {
        tile.height.value = height;
      }
      if (typeof block === "boolean") {
        tile.block.value = block;
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

  // Dropdowns

  async createDropdown(
    data: OmitPageId<AppRouterInputs["dropdowns"]["create"]>,
  ) {
    const dropdown = await client.dropdowns.create.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.dropdowns.value = this.dropdowns.value.concat(dropdown);
    return dropdown;
  }

  async updateDropdown(
    data: OmitPageId<AppRouterInputs["dropdowns"]["update"]>,
  ) {
    const dropdown = await client.dropdowns.update.mutate({
      pageId: this.pageId,
      ...data,
    });
    this.dropdowns.value = this.dropdowns.value.map((existing) =>
      existing.id === dropdown.id ? dropdown : existing,
    );
    return dropdown;
  }

  async addOptionToDropdown(id: string, value: string) {
    const dropdown = this.dropdowns.value.find(
      (dropdown) => dropdown.id === id,
    );
    if (!dropdown) {
      throw new Error(`Invalid dropdown ID: ${id}`);
    }
    return this.updateDropdown({
      id,
      options: dropdown.options.concat({ value }),
    });
  }
}
