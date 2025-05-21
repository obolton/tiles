import { handleError } from "@/utils/errors";
import { layoutTransition } from "@/utils/animation/layout";
import { viewTransition } from "@/utils/transitions";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { TileResizeEvent, TileEvent } from "@/utils/events";
import type { ClientTile } from "@/types/tiles";

export interface LayoutEditorOptions {
  element: HTMLElement;
  editor: Editor;
  collectionId: string;
}

export default class LayoutEditor {
  editor: Editor;
  collectionId: string;

  private readonly elementRef: WeakRef<HTMLElement>;

  private gridColumnWidth = 0;
  private gridRowHeight = 0;
  private gridColumns = 0;
  private columns = 0;
  private rows = 0;
  private idForPoint?: string | null;

  constructor({ element, editor, collectionId }: LayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.editor = editor;
    this.collectionId = collectionId;

    element.addEventListener("dnd-dragover", this);
    element.addEventListener("dnd-drop", this);
    element.addEventListener("dnd-dragend", this, { passive: true });
    element.addEventListener("tileresizestart", this);
    element.addEventListener("tileresize", this);
    element.addEventListener("tileresizeend", this);
    element.addEventListener("tiledelete", this);
  }

  disconnect() {
    const element = this.elementRef.deref();
    element?.removeEventListener("dnd-dragover", this);
    element?.removeEventListener("dnd-drop", this);
    element?.removeEventListener("dnd-dragend", this);
    element?.removeEventListener("tileresizestart", this);
    element?.removeEventListener("tileresize", this);
    element?.removeEventListener("tileresizeend", this);
    element?.removeEventListener("tiledelete", this);
  }

  get element() {
    const element = this.elementRef.deref();
    if (!element) {
      throw new Error("The element is no longer available");
    }
    return element;
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<ClientTile>);
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<ClientTile>);
      case "dnd-dragend":
        return this.handleDragEnd();
      case "tileresizestart":
        return this.handleResizeStart(event as TileResizeEvent);
      case "tileresize":
        return this.handleResize(event as TileResizeEvent);
      case "tileresizeend":
        return this.handleResizeEnd(event as TileResizeEvent);
      case "tiledelete":
        return this.handleDelete(event as TileEvent);
    }
  }

  // Drag and drop

  private handleDragOver(event: DragDropEvent<ClientTile>) {
    const { state } = event;

    event.stopPropagation();

    const id = state.data?.id;
    if (!id) {
      return;
    }

    const afterId = this.findIdForPoint(event);

    if (afterId !== this.idForPoint) {
      layoutTransition(() => {
        this.editor.moveTilePreview({
          id,
          collectionId: this.collectionId,
          afterId,
        });
      });
    }
    this.idForPoint = afterId;
  }

  private async handleDrop(event: DragDropEvent<ClientTile>) {
    const { state } = event;

    event.preventDefault();
    event.stopPropagation();

    const id = state.data?.placementId;
    if (!id) {
      return;
    }

    state.destination = this.element.querySelector<HTMLElement>(
      `[data-placement-id="${id}"]`,
    );

    const afterId = this.findIdForPoint(event);

    try {
      await this.editor.moveTile({
        id,
        collectionId: this.collectionId,
        afterId,
      });
    } catch (error) {
      handleError(error);
    }
  }

  private handleDragEnd() {
    this.idForPoint = undefined;
  }

  private findIdForPoint(event: DragDropEvent<ClientTile>) {
    const { clientX, clientY, state } = event;
    const dragPlacementId = state.data?.placementId;

    // Look for an element under the pointer
    let element = document
      .elementsFromPoint(clientX, clientY)
      .find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element.parentElement === this.element &&
          element.dataset.placementId !== dragPlacementId,
      );

    if (element) {
      return element.dataset.placementId || null;
    }

    // If no element was found, look for the previous element in the grid
    for (const child of this.element.children) {
      if (
        !(child instanceof HTMLElement) ||
        child.dataset.placementId === dragPlacementId
      ) {
        continue;
      }

      const bounds = child.getBoundingClientRect();

      // Element being compared is later in the grid
      if (
        bounds.top > clientY ||
        (bounds.bottom >= clientY && bounds.right > clientX)
      ) {
        break;
      }

      element = child;
    }

    return element?.dataset.placementId || null;
  }

  // Resize

  private handleResizeStart(event: TileResizeEvent) {
    const { width, height } = event;

    event.stopPropagation();

    const style = getComputedStyle(this.element);
    this.gridColumns = parseInt(style.getPropertyValue("--columns"), 10);
    this.gridRowHeight = parseInt(
      style.getPropertyValue("--grid-row-height"),
      10,
    );
    this.gridColumnWidth = this.element.clientWidth / this.gridColumns;
    this.columns = Math.max(Math.round(width / this.gridColumnWidth), 1);
    this.rows = Math.max(Math.round(height / this.gridRowHeight), 1);
  }

  private handleResize(event: TileResizeEvent) {
    const { target, defaultPrevented, width, height } = event;
    if (defaultPrevented || !(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const id = target.id;
    const columns = Math.min(
      Math.max(Math.round(width / this.gridColumnWidth), 1),
      this.gridColumns,
    );
    const rows = Math.max(Math.round(height / this.gridRowHeight), 1);

    if (columns !== this.columns || rows != this.rows) {
      viewTransition(() => {
        this.editor.resizeTilePreview({ id, columns, rows });
      });
    }

    this.columns = columns;
    this.rows = rows;
  }

  private async handleResizeEnd(event: TileResizeEvent) {
    const { target, defaultPrevented } = event;
    if (defaultPrevented || !(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const id = target.dataset.placementId ?? "";
    await this.editor.resizeTile(id, this.columns, this.rows);
  }

  // Delete

  private async handleDelete(event: TileEvent) {
    const { target, defaultPrevented } = event;
    if (defaultPrevented || !(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const id = target.dataset.placementId ?? "";
    const sibling = target.previousElementSibling || target.nextElementSibling;

    try {
      await this.editor.deleteTile(id, (commit) => {
        if (target) {
          destroy(target, {
            timing: { ...DEFAULT_TIMING, fill: "forwards" },
          });
          layoutTransition(commit);
        } else {
          commit();
        }
      });
      sibling?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      handleError(error);
    }
  }
}
