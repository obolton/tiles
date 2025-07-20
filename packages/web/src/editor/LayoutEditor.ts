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
  sectionId: string;
  ordered?: boolean;
}

export default class LayoutEditor {
  readonly editor: Editor;
  readonly sectionId: string;
  readonly ordered: boolean;

  private readonly elementRef: WeakRef<HTMLElement>;

  private pageX = 0;
  private pageY = 0;
  private gridColumnWidth = 0;
  private gridRowHeight = 0;
  private gridGap = 0;
  private x = 0;
  private y = 0;
  private columns = 0;
  private rows = 0;
  private idForPoint?: string | null;

  constructor({ element, editor, sectionId, ordered }: LayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.editor = editor;
    this.sectionId = sectionId;
    this.ordered = ordered ?? true;

    element.addEventListener("dnd-dragover", this);
    element.addEventListener("dnd-dragenter", this, { passive: true });
    element.addEventListener("dnd-dragleave", this);
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
    element?.removeEventListener("dnd-dragenter", this);
    element?.removeEventListener("dnd-dragleave", this);
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
      case "dnd-dragenter":
        return this.handleDragEnter();
      case "dnd-dragleave":
        return this.handleDragLeave();
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

  private updateLayoutInfo() {
    const style = getComputedStyle(this.element);
    this.gridColumnWidth = parseFloat(
      style.getPropertyValue("--grid-column-width"),
    );
    this.gridRowHeight = parseFloat(
      style.getPropertyValue("--grid-row-height"),
    );
    this.gridGap = parseFloat(style.getPropertyValue("--gap"));

    const rect = this.element.getBoundingClientRect();
    this.pageX = rect.x + window.scrollX + parseFloat(style.paddingLeft);
    this.pageY = rect.y + window.scrollY + parseFloat(style.paddingTop);
  }

  // Drag and drop

  private handleDragOver(event: DragDropEvent<ClientTile>) {
    const { state } = event;

    event.stopPropagation();

    const id = state.data?.id;
    if (!id) {
      return;
    }

    if (this.ordered) {
      const afterId = this.findIdForPoint(event);

      if (afterId !== this.idForPoint) {
        void layoutTransition(() => {
          this.editor.reorderTilePreview({
            id,
            sectionId: this.sectionId,
            afterId,
          });
        });
      }
      this.idForPoint = afterId;
    } else {
      const offsetX = event.clientX + window.scrollX - this.pageX;
      const offsetY = event.clientY + window.scrollY - this.pageY;
      const x = Math.max(
        Math.round(offsetX / (this.gridColumnWidth + this.gridGap)),
        0,
      );
      const y = Math.max(
        Math.round(offsetY / (this.gridRowHeight + this.gridGap)),
        0,
      );

      if (x !== this.x || y !== this.y) {
        this.x = x;
        this.y = y;

        void layoutTransition(() => {
          this.editor.positionTilePreview({
            id,
            x: this.x,
            y: this.y,
          });
        });
      }
    }
  }

  private handleDragEnter() {
    if (!this.ordered) {
      this.updateLayoutInfo();
    }
  }

  private handleDragLeave() {
    this.idForPoint = undefined;
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

    if (this.ordered) {
      const afterId = this.findIdForPoint(event);

      try {
        await this.editor.moveTile({
          id,
          sectionId: this.sectionId,
          afterId,
        });
        this.element
          .querySelector<HTMLElement>(`[data-placement-id="${id}"]`)
          ?.focus({ preventScroll: true });
      } catch (error) {
        handleError(error);
      }
    } else {
      try {
        await this.editor.positionTile({
          id,
          x: this.x,
          y: this.y,
        });
        this.element
          .querySelector<HTMLElement>(`[data-placement-id="${id}"]`)
          ?.focus({ preventScroll: true });
      } catch (error) {
        handleError(error);
      }
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

    this.updateLayoutInfo();

    this.columns = Math.max(
      Math.round(
        (width + this.gridGap) / (this.gridColumnWidth + this.gridGap),
      ),
      1,
    );
    this.rows = Math.max(
      Math.round((height + this.gridGap) / (this.gridRowHeight + this.gridGap)),
      1,
    );
  }

  private handleResize(event: TileResizeEvent) {
    const { target, defaultPrevented, width, height } = event;
    if (defaultPrevented || !(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const id = target.id;
    const columns = Math.max(
      Math.round(
        (width + this.gridGap) / (this.gridColumnWidth + this.gridGap),
      ),
      1,
    );
    const rows = Math.max(
      Math.round((height + this.gridGap) / (this.gridRowHeight + this.gridGap)),
      1,
    );

    if (columns !== this.columns || rows != this.rows) {
      viewTransition(() => {
        this.editor.positionTilePreview({ id, width: columns, height: rows });
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
    try {
      await this.editor.positionTile({
        id,
        width: this.columns,
        height: this.rows,
      });
    } catch (error) {
      handleError(error);
    }
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
          void destroy(target, {
            timing: { ...DEFAULT_TIMING, fill: "forwards" },
          });
          void layoutTransition(commit);
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
