import { handleError } from "@/utils/errors";
import { moveBefore } from "@/utils/dom";
import {
  createDragPlaceholder,
  getDragPosition,
} from "@/utils/drag-placeholder";
import { ResizeEvent } from "@/elements/resize/events";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { DragData } from "@/editor/LayoutEditor";
import type Tile from "@/models/Tile";
import type { DockEdge } from "@/models/Tile";

const MIN_TILE_RATIO = 0.1;
const MAX_TILE_RATIO = 0.9;

export interface DockLayoutEditorOptions {
  element: HTMLElement;
  edge: DockEdge;
  editor: Editor;
  signal?: AbortSignal;
}

export default class DockLayoutEditor {
  static attach(options: DockLayoutEditorOptions): DockLayoutEditor {
    return new DockLayoutEditor(options);
  }

  private readonly elementRef: WeakRef<HTMLElement>;
  private readonly edge: DockEdge;
  private readonly editor: Editor;
  private dragPlaceholder: HTMLElement | null = null;
  private beforeId: string | null = null;
  private dividers: HTMLElement[] = [];

  constructor({ element, edge, editor, signal }: DockLayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.edge = edge;
    this.editor = editor;

    element.dataset.drop = "true";
    element.addEventListener("dnd-dragenter", this, { signal });
    element.addEventListener("dnd-dragover", this, { signal });
    element.addEventListener("dnd-dragleave", this, { signal });
    element.addEventListener("dnd-drop", this, { signal });
    element.addEventListener("resizeend", this, { signal });

    // Subscribe to tile and edit mode changes for divider management
    const tileCollection = this.editor.dockedTiles[this.edge];
    tileCollection.subscribe(() => this.updateDividers(), signal);
    this.editor.isEditable.subscribe(() => this.updateDividers(), signal);

    this.updateDividers();
  }

  get element() {
    const element = this.elementRef.deref();
    if (!element) {
      throw new Error("The element is no longer available");
    }
    return element;
  }

  private get isHorizontal() {
    return this.edge === "TOP" || this.edge === "BOTTOM";
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent<DragData>);
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<DragData>);
      case "dnd-dragleave":
        return this.handleDragLeave();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<DragData>);
      case "resizeend":
        return this.handleDividerResizeEnd(event as ResizeEvent);
    }
  }

  private handleDragEnter(event: DragDropEvent<DragData>) {
    // Alt key bypasses dock zones
    if (event.altKey) {
      event.preventDefault();
      return false;
    }

    const tile = event.state?.data?.tile;
    if (!tile) {
      return;
    }

    this.showDragPlaceholder(tile);
  }

  private handleDragOver(event: DragDropEvent<DragData>) {
    if (event.altKey || !this.dragPlaceholder) {
      return;
    }

    const direction = this.isHorizontal ? "horizontal" : "vertical";
    const position = getDragPosition(
      this.element,
      event.clientX,
      event.clientY,
      direction,
      (el) => this.isOrderedElement(el),
    );

    if (position) {
      const { next } = position;
      this.beforeId =
        next instanceof HTMLElement ? next.dataset.id || next.id : null;
      moveBefore(this.element, this.dragPlaceholder, next);
    }
  }

  private handleDragLeave() {
    this.hideDragPlaceholder();
    this.beforeId = null;
  }

  private async handleDrop(event: DragDropEvent<DragData>) {
    const { state } = event;

    // Alt key bypasses dock zones
    if (event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.hideDragPlaceholder();

    const tile = state.data?.tile;
    if (!tile) {
      return;
    }

    try {
      await tile.setDock(this.edge, this.beforeId);

      // Apply view transition for smooth animation
      const element = state.element;
      if (element) {
        element.style.viewTransitionName = "drop";
        element.focus({ preventScroll: true });
        requestAnimationFrame(() => {
          element.style.viewTransitionName = "";
        });
      }
    } catch (error) {
      handleError(error);
    }

    this.beforeId = null;
  }

  private showDragPlaceholder(tile: Tile) {
    if (this.dragPlaceholder) {
      return;
    }

    if (this.element.dataset.empty !== undefined) {
      return;
    }

    this.dragPlaceholder = createDragPlaceholder();

    if (this.isHorizontal) {
      this.dragPlaceholder.style.setProperty(
        "--width",
        tile.width.value.toString(),
      );
    } else {
      this.dragPlaceholder.style.setProperty(
        "--height",
        tile.height.value.toString(),
      );
    }

    this.element.appendChild(this.dragPlaceholder);
  }

  private hideDragPlaceholder() {
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
  }

  private isOrderedElement(element: Element) {
    return (
      element !== this.dragPlaceholder &&
      !element.matches(":popover-open, resize-handle")
    );
  }

  // Divider management

  private updateDividers() {
    for (const divider of this.dividers) {
      divider.remove();
    }
    this.dividers = [];

    if (!this.editor.isEditable.value) {
      return;
    }

    const tiles = this.editor.dockedTiles[this.edge].value;
    if (tiles.length < 2) {
      return;
    }

    for (let i = 0; i < tiles.length - 1; i++) {
      const beforeTile = tiles[i];
      const afterTile = tiles[i + 1];
      if (!beforeTile || !afterTile) {
        continue;
      }

      const afterElement = document.getElementById(afterTile.id);
      if (afterElement) {
        const divider = this.createDivider(beforeTile.id, afterTile.id);
        this.element.insertBefore(divider, afterElement);
        this.dividers.push(divider);
      }
    }
  }

  private createDivider(beforeId: string, afterId: string): HTMLElement {
    const divider = document.createElement("resize-handle");
    divider.setAttribute(
      "direction",
      this.isHorizontal ? "horizontal" : "vertical",
    );
    divider.classList.add("tile-divider");
    divider.dataset.beforeId = beforeId;
    divider.dataset.afterId = afterId;
    return divider;
  }

  private handleDividerResizeEnd(event: ResizeEvent) {
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      !target.classList.contains("tile-divider")
    ) {
      return;
    }

    const beforeId = target.dataset.beforeId;
    const afterId = target.dataset.afterId;
    if (!beforeId || !afterId) {
      return;
    }

    const beforeTile = this.editor.getTile(beforeId);
    const afterTile = this.editor.getTile(afterId);
    if (!beforeTile || !afterTile) {
      return;
    }

    event.stopPropagation();

    const beforeElement = document.getElementById(beforeId);
    const afterElement = document.getElementById(afterId);
    if (!beforeElement || !afterElement) {
      return;
    }

    const delta = this.isHorizontal ? event.x : event.y;
    const beforeRect = beforeElement.getBoundingClientRect();
    const afterRect = afterElement.getBoundingClientRect();

    const size = this.isHorizontal ? "width" : "height";
    const combined = beforeTile[size].value + afterTile[size].value;
    const combinedPixels = beforeRect[size] + afterRect[size];
    const newBeforePixels = beforeRect[size] + delta;

    const minRatio = Math.max(MIN_TILE_RATIO, 1 / combined);
    const maxRatio = Math.min(MAX_TILE_RATIO, 1 - 1 / combined);
    const ratio = Math.max(
      minRatio,
      Math.min(maxRatio, newBeforePixels / combinedPixels),
    );

    beforeTile[size].value = combined * ratio;
    afterTile[size].value = combined * (1 - ratio);

    Promise.all([
      beforeTile.persistPosition(),
      afterTile.persistPosition(),
    ]).catch(handleError);
  }
}
