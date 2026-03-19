import client from "@/api/client";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { reactive, flag, combine } from "@/utils/reactivity";
import { scrollIntoViewIfNeeded } from "@/utils/scroll";
import { focusInside } from "@/utils/focus";
import { isEditMode, setEditMode } from "@/utils/edit";
import { startPresentation } from "@/presentation";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import Page, { type PageData } from "@/models/Page";
import Section from "@/models/Section";
import Image from "@/models/Image";
import Link from "@/models/Link";
import ChatState from "@/components/chat/ChatState";
import { OperationManager, execute } from "@/operations";
import type Tile from "@/models/Tile";
import type { Reactive } from "@/utils/reactivity";
import type { AnyAction, OperationInput } from "@/operations";

export type { PageData } from "@/models/Page";

const IS_SERVER = import.meta.env.SSR;

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");

export default class Editor {
  static #current?: Editor;

  readonly page: Page;
  readonly isEditable: Reactive<boolean>;
  readonly selection: Reactive<Set<Tile>>;
  readonly references: Reactive<Tile[]>;
  readonly isPromptOpen: Reactive<boolean>;
  readonly isPromptToolbarOpen: Reactive<boolean>;
  readonly isTileEditable: Reactive<boolean>;
  readonly chat: ChatState;

  readonly operations: OperationManager<AnyAction> | null;
  readonly canUndo: Reactive<boolean>;
  readonly canRedo: Reactive<boolean>;

  get pageId() {
    return this.page.id;
  }

  get workspaceId() {
    return this.page.workspaceId;
  }

  get activeSection(): Section | null {
    const selection = Array.from(this.selection.value);
    const lastTile = selection.at(-1);
    if (lastTile instanceof Section) {
      return lastTile;
    }
    const sectionId = lastTile?.sectionId;
    if (sectionId) {
      const section = this.page.index.get(sectionId);
      if (section instanceof Section) {
        return section;
      }
    }
    return null;
  }

  static init(page: PageData) {
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

  private constructor(page: PageData) {
    this.page = new Page(page);
    this.page.editor = this;
    this.page.initTiles(page.tiles);
    this.isEditable = flag(isEditMode());
    this.selection = reactive(new Set());
    this.references = reactive([]);
    this.isPromptOpen = flag(false);
    this.isPromptToolbarOpen = flag(false);
    this.chat = new ChatState();
    this.isTileEditable = combine(
      { isEditable: this.isEditable, isPromptOpen: this.isPromptOpen },
      ({ isEditable, isPromptOpen }) => isEditable && !isPromptOpen,
    );

    this.canUndo = reactive(false);
    this.canRedo = reactive(false);
    this.operations = IS_SERVER ? null : new OperationManager(page.id);

    if (!IS_SERVER) {
      this.enablePointerEvents();

      this.isEditable.subscribe(() => {
        setEditMode(this.isEditable.value);
        if (this.isEditable.value) {
          requestAnimationFrame(() => this.focusFirstTile());
        } else {
          this.clearSelection();
        }
      });

      // Focus the first tile if starting in edit mode
      if (this.isEditable.value) {
        requestAnimationFrame(() => this.focusFirstTile());
      }

      // Load operation history
      this.operations?.load().then(() => this.syncUndoRedoState());
    }
  }

  enablePointerEvents() {
    document.addEventListener("pointerdown", this.pointerDown.bind(this), {
      passive: true,
    });
    document.addEventListener("focusin", this.focusIn.bind(this));
    document.addEventListener("keydown", this.keyDown.bind(this));
    document.addEventListener("dragover", this.dragOver.bind(this));
    document.addEventListener("drop", this.drop.bind(this));
  }

  private pointerDown(event: PointerEvent) {
    if (
      event.button === PRIMARY_MOUSE_BUTTON &&
      !event.defaultPrevented &&
      event.target instanceof Element &&
      event.target.matches("main, [data-dock-zone]")
    ) {
      this.clearSelection();
    }
  }

  private focusIn(event: FocusEvent) {
    if (!this.isEditable.value) {
      return;
    }

    const target = event.target as Element;
    const pageItem = target.closest("page-item");

    if (!pageItem?.id) {
      return;
    }

    const tile = this.page.index.get(pageItem.id);
    if (tile && !this.selection.value.has(tile)) {
      this.select([pageItem.id], false);
    }
  }

  private keyDown(event: KeyboardEvent) {
    const isMod = event.metaKey || event.ctrlKey;
    const isInput =
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable);

    // AI Prompt: Cmd/Ctrl+J
    if (isMod && event.key === "j" && this.isEditable.value) {
      event.preventDefault();
      this.togglePromptToolbar();
      return;
    }

    // Present: Cmd/Ctrl+Enter (not in text inputs)
    if (isMod && event.key === "Enter" && !isInput) {
      event.preventDefault();
      this.isEditable.value = false;
      startPresentation();
      return;
    }

    // Undo: Cmd/Ctrl+Z (not in text inputs - they have their own undo)
    if (isMod && event.key === "z" && !event.shiftKey && !isInput) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Redo: Cmd/Ctrl+Shift+Z (not in text inputs)
    if (isMod && event.key === "z" && event.shiftKey && !isInput) {
      event.preventDefault();
      this.redo();
      return;
    }

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
            await Image.create(this.page, {
              sectionId: this.activeSection?.id,
              imageId,
            });
          },
        });
      }
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await Link.create(this.page, {
          sectionId: this.activeSection?.id,
          url,
        });
      });
    }
  }

  // Selection

  focusFirstTile() {
    const first = this.page.tiles.value[0];
    if (!first) {
      return;
    }
    this.select([first.id]);
    const element = document.getElementById(first.id);
    if (element) {
      focusInside(element);
    }
  }

  select(ids: string[], extendSelection = false) {
    const tiles = new Set(ids.map((id) => this.page.getTile(id)));
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
    const tiles = new Set(ids.map((id) => this.page.getTile(id)));
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

    this.deleteTiles(Array.from(this.selection.value));
    this.clearSelection();
  }

  // References

  toggleReference(id: string) {
    const index = this.references.value.findIndex((tile) => tile.id === id);
    if (index >= 0) {
      this.references.value = this.references.value.toSpliced(index, 1);
    } else {
      this.references.value = [...this.references.value, this.page.getTile(id)];
    }
  }

  clearReferences() {
    if (this.references.value.length > 0) {
      this.references.value = [];
    }
  }

  // Prompt toolbar

  openPromptToolbar() {
    if (this.isPromptOpen.value) {
      return;
    }

    const selected = Array.from(this.selection.value);
    if (selected.length > 0 && this.references.value.length === 0) {
      this.references.value = selected;
    }

    this.isPromptToolbarOpen.value = true;
    this.isPromptOpen.value = true;
    document.body.dataset.prompt = "";
  }

  closePromptToolbar() {
    this.isPromptToolbarOpen.value = false;
    this.isPromptOpen.value = false;
    delete document.body.dataset.prompt;
    this.clearReferences();
    this.chat.clear();
  }

  togglePromptToolbar() {
    if (this.isPromptToolbarOpen.value) {
      this.closePromptToolbar();
    } else {
      this.openPromptToolbar();
    }
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
    beforeId: string | null = null,
    select = true,
  ) {
    this.page.index.set(tile.id, tile);

    viewTransition(() => {
      if (sectionId) {
        this.page.getSection(sectionId).tiles.insertBefore(beforeId, tile);
      } else {
        this.page.tiles.insertBefore(beforeId, tile);
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
      tile.parent?.remove(tile);
      this.page.index.delete(tile.id);
    });
  }

  // Operations (Undo/Redo)

  private syncUndoRedoState(): void {
    this.canUndo.value = this.operations?.canUndo ?? false;
    this.canRedo.value = this.operations?.canRedo ?? false;
  }

  async recordOperation(operation: OperationInput<AnyAction>): Promise<void> {
    await this.operations?.record(operation);
    this.syncUndoRedoState();
  }

  async undo(): Promise<void> {
    const operation = await this.operations?.undo();
    if (operation) {
      await execute(this, operation, "reverse");
    }
    this.syncUndoRedoState();
  }

  async redo(): Promise<void> {
    const operation = await this.operations?.redo();
    if (operation) {
      await execute(this, operation, "apply");
    }
    this.syncUndoRedoState();
  }
}
