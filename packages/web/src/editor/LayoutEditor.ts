import { handleError } from "@/utils/errors";
import { layoutTransition } from "@/utils/animation/layout";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { TileResizeEvent, TileEvent } from "@/utils/events";
import type { Tile } from "@/types/tiles";

export interface LayoutEditorOptions {
  element: HTMLElement;
  grid: HTMLElement;
  editor: Editor;
  sectionId: string;
}

export interface DragData {
  tile: Tile;
}

export default class LayoutEditor {
  readonly editor: Editor;
  readonly sectionId: string;

  private readonly elementRef: WeakRef<HTMLElement>;
  private readonly gridRef: WeakRef<HTMLElement>;

  private pageX = 0;
  private pageY = 0;
  private startRow = 0;
  private endRow = 0;
  private gridColumnWidth = 0;
  private gridRows: number[] = [];
  private gridColumnGap = 0;
  private x = 0;
  private y = 0;
  private columns = 0;
  private rows = 0;
  private idForPoint?: string | null;
  private dragPlaceholder: HTMLElement | null = null;

  constructor({ element, grid, editor, sectionId }: LayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.gridRef = new WeakRef(grid);
    this.editor = editor;
    this.sectionId = sectionId;

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

  get grid() {
    const element = this.gridRef.deref();
    if (!element) {
      throw new Error("The element is no longer available");
    }
    return element;
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<DragData>);
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent<DragData>);
      case "dnd-dragleave":
        return this.handleDragLeave();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<DragData>);
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
    const style = getComputedStyle(this.grid);
    this.gridColumnWidth = parseFloat(
      style.getPropertyValue("--grid-column-width"),
    );
    this.gridColumnGap = parseFloat(style.columnGap);

    const rowGap = parseFloat(style.rowGap);
    const rowHeights = style.gridTemplateRows.split(" ").map(parseFloat);
    let top = 0;
    this.gridRows = [];
    for (const height of rowHeights) {
      this.gridRows.push(top);
      top += height + rowGap;
    }

    const rect = this.element.getBoundingClientRect();
    this.pageX = rect.x + window.scrollX + parseFloat(style.paddingLeft);
    this.pageY = rect.y + window.scrollY + parseFloat(style.paddingTop);
  }

  private getGridRow(offsetY: number) {
    for (let i = 1; i < this.gridRows.length; i++) {
      if (offsetY < this.gridRows[i]!) {
        return i - 1;
      }
    }
    return this.gridRows.length - 1;
  }

  private getGridPosition(event: DragDropEvent) {
    const offsetX =
      event.clientX -
      event.state.offsetX +
      window.scrollX +
      this.element.scrollLeft -
      this.pageX -
      24;
    const offsetY =
      event.clientY -
      event.state.offsetY +
      window.scrollY +
      this.element.scrollTop -
      this.pageY -
      24;
    const x = Math.max(
      Math.round(offsetX / (this.gridColumnWidth + this.gridColumnGap)),
      0,
    );
    const y = this.getGridRow(offsetY);
    return { x, y };
  }

  // Drag and drop

  private handleDragOver(event: DragDropEvent<DragData>) {
    const {
      state: { data },
    } = event;

    event.stopPropagation();

    const id = data?.tile.id;
    if (!id) {
      return;
    }

    const { x, y } = this.getGridPosition(event);

    if (x !== this.x || y !== this.y) {
      this.x = x;
      this.y = y;

      void layoutTransition(() => {
        this.dragPlaceholder?.style.setProperty("--x", x.toString());
        this.dragPlaceholder?.style.setProperty("--y", y.toString());
      });
    }
  }

  private showDragPlaceholder({
    x,
    y,
    width,
    height,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    if (this.dragPlaceholder) {
      return;
    }

    const placeholder = document.createElement("div");
    placeholder.classList.add("drag-placeholder");
    placeholder.style.setProperty("--x", x.toString());
    placeholder.style.setProperty("--y", y.toString());
    placeholder.style.setProperty("--width", width.toString());
    placeholder.style.setProperty("--height", height.toString());
    placeholder.dataset.animateLayoutId = "drag-placeholder-" + this.sectionId;
    this.element.appendChild(placeholder);
    this.dragPlaceholder = placeholder;
  }

  private hideDragPlaceholder() {
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
  }

  private handleDragEnter(event: DragDropEvent<DragData>) {
    const tile = event.state?.data?.tile;
    if (!tile) {
      return;
    }

    this.updateLayoutInfo();

    const { x, y } = this.getGridPosition(event);

    this.x = x;
    this.y = y;

    this.showDragPlaceholder({
      x,
      y,
      width: tile.width.value,
      height: tile.height.value,
    });
  }

  private handleDragLeave() {
    this.idForPoint = undefined;
    this.hideDragPlaceholder();
  }

  private async handleDrop(event: DragDropEvent<DragData>) {
    const { state } = event;

    event.preventDefault();
    event.stopPropagation();

    const tile = state.data?.tile;
    if (!tile) {
      return;
    }

    state.destination = this.dragPlaceholder;

    try {
      await this.editor.positionTile({
        id: tile.placementId,
        sectionId: this.sectionId,
        x: this.x,
        y: this.y,
      });
      this.element
        .querySelector<HTMLElement>(`[data-placement-id="${tile.placementId}"]`)
        ?.focus({ preventScroll: true });
    } catch (error) {
      handleError(error);
    }
  }

  private handleDragEnd() {
    this.idForPoint = undefined;
  }

  private findIdForPoint(event: DragDropEvent<Tile>) {
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
    const { width, height, target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    event.stopPropagation();

    this.updateLayoutInfo();

    this.columns = Math.max(
      Math.round(
        (width + this.gridColumnGap) /
          (this.gridColumnWidth + this.gridColumnGap),
      ),
      1,
    );
    this.startRow = this.getGridRow(target.offsetTop);
    this.endRow = this.getGridRow(target.offsetTop + height);
    this.rows = Math.max(this.endRow - this.startRow + 1, 1);
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
        (width + this.gridColumnGap) /
          (this.gridColumnWidth + this.gridColumnGap),
      ),
      1,
    );
    this.endRow = this.getGridRow(target.offsetTop + height);
    const rows = Math.max(this.endRow - this.startRow + 1, 1);

    if (columns !== this.columns || rows != this.rows) {
      this.editor.positionTilePreview({ id, width: columns, height: rows });
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
