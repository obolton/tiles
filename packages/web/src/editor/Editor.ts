import * as Y from "yjs";
import { PageCollaboration } from "@/collaboration/PageCollaboration";
import { uploadMedia } from "@/utils/media";
import { ACCEPT_IMAGE_TYPES, getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import { set, flag, combine } from "@/utils/reactivity";
import { last } from "@/utils/iterables";
import { scrollIntoViewIfNeeded, whenVisible } from "@/utils/scroll";
import { pulse } from "@/utils/animation/effects";
import { prefersReducedMotion } from "@/utils/preferences";
import { focusInside } from "@/utils/focus";
import { isEditMode, setEditMode } from "@/utils/edit";
import { startPresentation } from "@/presentation";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import Page, { type PageData } from "@/models/Page";
import Section from "@/models/Section";
import { parseParentId } from "@/models/parentId";
import Image from "@/models/Image";
import Link from "@/models/Link";
import ChatState from "@/components/chat/ChatState";
import { PageUndoManager } from "@/collaboration/PageUndoManager";
import type Tile from "@/models/Tile";
import type { Reactive, ReactiveSet } from "@/utils/reactivity";

export type { PageData } from "@/models/Page";

const IS_SERVER = import.meta.env.SSR;

const UNDO_SELECTION = Symbol("undo-selection");

export default class Editor {
  static #current?: Editor;

  readonly page: Page;
  collaboration: PageCollaboration | null = null;
  readonly isCollaborating = flag(false);
  readonly isEditable: Reactive<boolean>;
  readonly selection: ReactiveSet<string>;
  readonly references: ReactiveSet<string>;
  readonly isPromptOpen: Reactive<boolean>;
  readonly isPromptToolbarOpen: Reactive<boolean>;
  readonly isTileEditable: Reactive<boolean>;
  readonly chat: ChatState;

  readonly undoManager: PageUndoManager | null;
  readonly canUndo: Reactive<boolean>;
  readonly canRedo: Reactive<boolean>;

  get pageId() {
    return this.page.id;
  }

  get workspaceId() {
    return this.page.workspaceId;
  }

  get insertBeforeId(): string | null {
    const lastSelected = this.lastSelectedTile;
    if (!lastSelected || lastSelected instanceof Section) {
      return null;
    }
    return lastSelected.next?.id ?? null;
  }

  get activeSection(): Section | null {
    const lastTile = this.lastSelectedTile;
    if (lastTile instanceof Section) {
      return lastTile;
    }
    const parent = parseParentId(lastTile?.parentId.value ?? null);
    if (parent.type === "section") {
      const section = this.page.index.get(parent.sectionId);
      if (section instanceof Section) {
        return section;
      }
    }
    return null;
  }

  private get lastSelectedTile(): Tile | null {
    const id = last(this.selection);
    return id === null ? null : (this.page.index.get(id) ?? null);
  }

  static init(page: PageData, doc: Y.Doc) {
    if (this.#current) {
      throw new Error("The editor has already been initialized");
    }

    const editor = new Editor(page, doc);

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

  private constructor(page: PageData, doc: Y.Doc) {
    this.selection = set();
    this.references = set();
    this.page = new Page(page, doc, (ids) => this.pruneDeletedTiles(ids));
    this.page.editor = this;
    this.isEditable = flag(isEditMode());
    this.isPromptOpen = flag(false);
    this.isPromptToolbarOpen = flag(false);
    this.chat = new ChatState();
    this.isTileEditable = combine(
      { isEditable: this.isEditable, isPromptOpen: this.isPromptOpen },
      ({ isEditable, isPromptOpen }) => isEditable && !isPromptOpen,
    );

    if (!IS_SERVER) {
      this.undoManager = new PageUndoManager(doc, {
        onRecord: (meta) => this.rememberSelection(meta),
        onApply: (meta) => this.restoreSelection(meta),
      });
      this.canUndo = this.undoManager.canUndo;
      this.canRedo = this.undoManager.canRedo;
      this.enablePointerEvents();

      this.selection.subscribe(() => this.publishSelection());

      // Focus the first tile if starting in edit mode
      if (this.isEditable.value) {
        this.startCollaboration();
        requestAnimationFrame(() => this.focusFirstTile());
      }
    } else {
      this.undoManager = null;
      this.canUndo = flag(false);
      this.canRedo = flag(false);
    }
  }

  private startCollaboration() {
    if (this.collaboration) {
      return;
    }
    this.collaboration = new PageCollaboration(this.page.id, this.page.doc);
    this.isCollaborating.on();
    this.publishSelection();
  }

  private stopCollaboration() {
    this.isCollaborating.off();
    this.collaboration?.dispose();
    this.collaboration = null;
  }

  setEditable(editable: boolean) {
    if (editable === this.isEditable.value) {
      return;
    }

    if (editable) {
      this.isEditable.value = true;
      setEditMode(true);
      this.startCollaboration();
      requestAnimationFrame(() => this.focusFirstTile());
    } else {
      this.clearSelection();
      this.isEditable.value = false;
      setEditMode(false);
      this.stopCollaboration();
    }
  }

  enablePointerEvents() {
    document.addEventListener("pointerdown", this.pointerDown.bind(this), {
      passive: true,
    });
    document.addEventListener("focusin", this.focusIn.bind(this));
    document.addEventListener("keydown", this.keyDown.bind(this));
    document.addEventListener("paste", this.paste.bind(this));
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

    if (!this.selection.has(pageItem.id)) {
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
      this.setEditable(false);
      startPresentation();
      return;
    }

    // Undo: Cmd/Ctrl+Z (not in text inputs - they have their own undo)
    if (isMod && event.key === "z" && !event.shiftKey && !isInput && this.isEditable.value) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y (not in text inputs)
    if (
      isMod &&
      !isInput &&
      this.isEditable.value &&
      ((event.key === "z" && event.shiftKey) || event.key === "y")
    ) {
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
      this.selection.size > 0
    ) {
      event.preventDefault();
      this.deleteSelection();
    }
  }

  private async paste(event: ClipboardEvent) {
    if (!this.isEditable.value || !event.clipboardData) {
      return;
    }

    const file = Array.from(event.clipboardData.files).find((file) =>
      ACCEPT_IMAGE_TYPES.has(file.type),
    );
    if (!file) {
      return;
    }

    event.preventDefault();

    const { id, width, height } = await uploadMedia({
      file,
      purpose: "content",
      workspaceId: this.workspaceId,
    });
    await Image.create(this.page, {
      parentId: this.activeSection?.id ?? null,
      beforeId: this.insertBeforeId,
      imageId: id,
      size: { width, height },
      sizing: "AUTO",
      width: this.page.width.value,
    });
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

  private async drop(event: DragEvent) {
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
        const { id, width, height } = await uploadMedia({
          file,
          purpose: "content",
          workspaceId: this.workspaceId,
        });
        await Image.create(this.page, {
          parentId: this.activeSection?.id ?? null,
          beforeId: this.insertBeforeId,
          imageId: id,
          size: { width, height },
          sizing: "AUTO",
          width: this.page.width.value,
        });
      }
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await Link.create(this.page, {
          parentId: this.activeSection?.id ?? null,
          beforeId: this.insertBeforeId,
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

  async revealTile(tileId: string) {
    const element = document.getElementById(tileId);
    if (!element) {
      return;
    }
    scrollIntoViewIfNeeded(element, { behavior: "smooth", block: "center" });
    if (prefersReducedMotion()) {
      return;
    }
    try {
      await whenVisible(element, { rootMargin: "-80px", threshold: 0.5 });
      pulse(element);
    } catch {
      // Do nothing
    }
  }

  revealClient(clientId: number) {
    const tileId = this.collaboration?.presence.getActiveTile(clientId);
    if (tileId) {
      this.revealTile(tileId);
    }
  }

  select(ids: string[], extendSelection = false) {
    const present = ids.filter((id) => this.page.index.has(id));
    if (present.length === 0) {
      return;
    }
    if (extendSelection) {
      this.selection.add(...present);
    } else {
      this.selection.replace(present);
    }
    this.undoManager?.stopCapturing();
  }

  deselect(ids: string[]) {
    this.selection.delete(...ids);
    this.undoManager?.stopCapturing();
  }

  clearSelection() {
    this.selection.clear();
    this.undoManager?.stopCapturing();
  }

  private publishSelection() {
    this.collaboration?.publishSelection(Array.from(this.selection));
  }

  deleteSelection() {
    if (this.selection.size === 0) {
      return;
    }

    this.deleteTiles(Array.from(this.selection));
    this.undoManager?.stopCapturing();
  }

  // References

  get referenceIds(): string[] {
    return Array.from(this.references);
  }

  toggleReference(id: string) {
    if (this.references.has(id)) {
      this.references.delete(id);
    } else if (this.page.index.has(id)) {
      this.references.add(id);
    }
  }

  clearReferences() {
    this.references.clear();
  }

  private pruneDeletedTiles(ids: ReadonlySet<string>) {
    this.selection.delete(...ids);
    this.references.delete(...ids);
  }

  // Prompt toolbar

  openPromptToolbar() {
    if (this.isPromptOpen.value) {
      return;
    }

    if (this.selection.size > 0 && this.references.size === 0) {
      this.references.replace(this.selection.value);
    }

    this.isPromptToolbarOpen.value = true;
    this.isPromptOpen.value = true;
    document.body.dataset.prompt = "";

    requestAnimationFrame(() => {
      document.getElementById("prompt-input")?.focus();
    });
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

  // Tiles

  async deleteTiles(ids: string[]) {
    // Tag elements before removal so the view transition can capture them.
    const items = document.getElementsByTagName("page-item");
    for (const item of items) {
      if (item.id) {
        item.style.viewTransitionName = `item-${item.id}`;
      }
    }

    const elements = ids.map((id) => document.getElementById(id)).filter((element) => !!element);
    elements.forEach((element) => {
      element.style.viewTransitionClass = "destroy";
    });

    // If the focus was in a tile to be deleted, move focus to a new element
    let focus: Element | null = null;
    const containsFocus = !!elements.find((element) => element.contains(document.activeElement));
    if (containsFocus) {
      const last = elements.at(-1);
      focus = (last?.nextElementSibling || last?.previousElementSibling) ?? null;
    }

    const doc = this.page.doc;

    viewTransition(() => {
      const tilesMap = doc.getMap<Y.Map<unknown>>("tiles");
      doc.transact(() => {
        for (const id of ids) {
          tilesMap.delete(id);
        }
      });

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

  addTile(tile: Tile, select = true) {
    if (!select) {
      return;
    }

    this.select([tile.id]);
    const element = document.getElementById(tile.id);
    if (element) {
      focusInside(element, { preventScroll: true });
      scrollIntoViewIfNeeded(element, { behavior: "smooth" });
    }
  }

  // Undo / redo

  undo(): void {
    this.undoManager?.undo();
  }

  redo(): void {
    this.undoManager?.redo();
  }

  dispose(): void {
    this.stopCollaboration();
    this.undoManager?.dispose();
  }

  private rememberSelection(meta: Map<unknown, unknown>) {
    meta.set(UNDO_SELECTION, Array.from(this.selection));
  }

  private restoreSelection(meta: Map<unknown, unknown>) {
    const ids = meta.get(UNDO_SELECTION);
    if (!Array.isArray(ids)) {
      return;
    }
    this.select(ids);
    const first = ids.find((id) => this.selection.has(id));
    if (first === undefined) {
      return;
    }
    requestAnimationFrame(() => this.revealTile(first));
  }
}
