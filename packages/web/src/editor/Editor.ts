import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { reactive, flag, array } from "@/utils/reactivity";
import { scrollIntoViewIfNeeded } from "@/utils/scroll";
import { focusInside } from "@/utils/focus";
import { isEditMode } from "@/utils/edit";
import { createState } from "@/utils/richText/state";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import TileCollection from "@/models/TileCollection";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Video from "@/models/Video";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import MapObject from "@/models/Map";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import Dropdown from "@/models/Dropdown";
import type Tile from "@/models/Tile";
import type { ClientTile } from "api/types/tiles";
import type { FontId } from "@/config/fonts";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";
import type { Invite, PageAccess, User } from "@/types/collaboration";
import type { Color } from "@/utils/color";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";

export type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

type OmitPageId<T extends { pageId: string }> = Omit<T, "pageId">;

type TransitionFunction = (commit: () => void) => void;

function immediateTransition(commit: () => void) {
  commit();
}

const IS_SERVER = import.meta.env.SSR;

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");

function getReactiveTile(editor: Editor, tile: ClientTile): Tile {
  const type = tile.type;
  switch (type) {
    case "SECTION":
      return new Section(editor, tile);
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
      return new MapObject(editor, tile);
    case "TABLE":
      return new Table(editor, tile);
    case "CHART":
      return new Chart(editor, tile);
    default:
      throw new Error(`Invalid tile type: ${type}`);
  }
}

export default class Editor {
  static #current?: Editor;

  readonly pageId: string;
  readonly workspaceId: string;
  readonly isEditable: Reactive<boolean>;
  readonly title: Reactive<string>;
  readonly backgroundColor: Reactive<Color | null>;
  readonly font: Reactive<FontId>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly index: Map<string, Tile>;
  readonly tiles: TileCollection;
  readonly access: ReactiveArray<PageAccess>;
  readonly invites: ReactiveArray<Invite>;
  readonly author: User;
  readonly selection: Reactive<Set<Tile>>;
  readonly dropdowns: ReactiveArray<Dropdown>;

  activeSection: Section | null = null;

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
    this.backgroundColor = reactive(page.backgroundColor);
    this.font = reactive(page.font);
    this.coverImageUrl = reactive(page.coverImageUrl);
    this.isPublished = reactive(page.published);
    this.index = new Map();
    this.tiles = new TileCollection(this);
    this.access = array(page.access);
    this.invites = array(page.invites);
    this.author = page.author;
    this.selection = reactive(new Set());
    this.dropdowns = array(page.dropdowns.map((d) => new Dropdown(this, d)));

    const parentIds = new Map<string, string | null>();

    for (const tile of page.tiles) {
      const object = getReactiveTile(this, tile);
      this.index.set(object.id, object);
      if (tile.sectionId) {
        parentIds.set(object.id, tile.sectionId);
      }
    }

    for (const item of this.index.values()) {
      const parentId = parentIds.get(item.id);
      if (parentId) {
        const parent = this.index.get(parentId);

        if (!(parent instanceof Section)) {
          throw new Error(`Invalid parent: ${parentId}`);
        }

        parent.tiles.append(item);
      } else {
        this.tiles.append(item);
      }
    }

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
            const imageId = await uploadMedia({
              file: result.image,
              purpose: "content",
              workspaceId: this.workspaceId,
            });
            await Image.create(this, {
              sectionId: this.activeSection?.id,
              imageId,
            });
          },
        });
      }
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await Link.create(this, {
          sectionId: this.activeSection?.id,
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

  async setBackgroundColor(backgroundColor: Color) {
    return client.pages.update.mutate({
      pageId: this.pageId,
      backgroundColor,
    });
  }

  async setPublished(published: boolean) {
    this.isPublished.value = published;
    return client.pages.update.mutate({ pageId: this.pageId, published });
  }

  async deletePage() {
    return client.pages.delete.mutate({ pageId: this.pageId });
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

    this.clearSelection();
    this.deleteTiles(Array.from(this.selection.value));
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

  // Tiles

  getTile(id: string) {
    const tile = this.index.get(id);
    if (!tile) {
      throw new Error(`Tile cannot be found: ${id}`);
    }
    return tile;
  }

  async deleteTiles(tiles: Tile[]) {
    const ids = tiles.map((tile) => tile.id);

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
      .map((id) => document.getElementById(id))
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
      this.removeTiles(tiles);

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

  addTile(
    tile: Tile,
    sectionId: string | null = null,
    afterId: string | null = null,
    select = true,
  ) {
    this.index.set(tile.id, tile);

    viewTransition(() => {
      if (sectionId) {
        const section = this.getTile(sectionId);
        if (!(section instanceof Section)) {
          throw new Error(`Invalid section ID: ${sectionId}`);
        }
        section.tiles.insertAfter(afterId, tile);
      } else {
        this.tiles.insertAfter(afterId, tile);
      }
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

  removeTiles(tiles: Tile[]) {
    tiles.forEach((tile) => {
      tile.parent?.tiles.remove(tile);
      this.index.delete(tile.id);
    });
  }

  // TODO: Restore title setting
  async updateText(data: OmitPageId<AppRouterInputs["text"]["update"]>) {
    // Update the page title
    if (data.content) {
      const firstTextTileId = this.tiles.value.find(
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
    const text = this.getTile(id);
    if (!(text instanceof Text)) {
      throw new Error(`Invalid text tile ID: ${id}`);
    }
    if (!text.state.value) {
      text.state.value = createState(text.content.value);
    }
    return text.state;
  }

  // Tables

  getTable(tableId: string) {
    const table = this.getTile(tableId);
    if (!(table instanceof Table)) {
      throw new Error(`Invalid table ID: ${tableId}`);
    }
    return table;
  }

  getTableColumnData(tableId: string, columnId: string) {
    const table = this.getTable(tableId);
    return table.rows.derive((rows) =>
      rows.map((row) => row.data[columnId] ?? null),
    );
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

  getDropdown(id: string): Dropdown {
    const dropdown = this.dropdowns.value.find((d) => d.id === id);
    if (!dropdown) {
      throw new Error(`Dropdown cannot be found: ${id}`);
    }
    return dropdown;
  }

  addDropdown(dropdown: Dropdown) {
    this.dropdowns.value = this.dropdowns.value.concat(dropdown);
  }

  removeDropdown(dropdown: Dropdown) {
    this.dropdowns.value = this.dropdowns.value.filter(
      (d) => d.id !== dropdown.id,
    );
  }
}
