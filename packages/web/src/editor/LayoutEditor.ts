import { handleError } from "@/utils/errors";
import { getSnapPoints, findSnapPoint, type SnapPoints } from "@/utils/snap";
import { moveBefore } from "@/utils/dom";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { PageItemEvent } from "@/elements/item/events";
import type Tile from "@/models/Tile";

export type LayoutType = "VERTICAL" | "HORIZONTAL" | "GRID" | "FREEFORM";

export interface LayoutEditorOptions {
  element: HTMLElement;
  grid: HTMLElement;
  layoutType: LayoutType;
  dropTarget?: HTMLElement;
  editor: Editor;
  sectionId: string | null;
  signal?: AbortSignal;
}

export interface DragData {
  tile: Tile;
}

interface RowLayout {
  top: number;
  height: number;
}

const SNAP_THRESHOLD = 64;

export default class LayoutEditor {
  static attach(options: LayoutEditorOptions): LayoutEditor {
    return new LayoutEditor(options);
  }

  readonly editor: Editor;
  readonly sectionId: string | null;

  layoutType: LayoutType;

  private readonly elementRef: WeakRef<HTMLElement>;
  private readonly gridRef: WeakRef<HTMLElement>;

  private gridRect: DOMRect;
  private gridColumnWidth = 0;
  private gridRowMinHeight = 24;
  private gridRows: RowLayout[] = [];
  private gridColumnGap = 0;
  private gridRowGap = 0;

  private afterId: string | null = null;
  private x = 0;
  private y = 0;

  private resizing: Tile | null = null;
  private dragPlaceholder: HTMLElement | null = null;
  private snapPoints: SnapPoints = { x: [], y: [] };

  constructor({
    element,
    grid,
    layoutType,
    dropTarget = element,
    editor,
    sectionId,
    signal,
  }: LayoutEditorOptions) {
    this.editor = editor;
    this.sectionId = sectionId;
    this.layoutType = layoutType;
    this.elementRef = new WeakRef(element);
    this.gridRef = new WeakRef(grid);

    this.gridRect = grid.getBoundingClientRect();

    dropTarget.dataset.drop = "true";
    dropTarget.addEventListener("dnd-dragover", this, { signal });
    dropTarget.addEventListener("dnd-dragenter", this, {
      passive: true,
      signal,
    });
    dropTarget.addEventListener("dnd-dragleave", this, { signal });
    dropTarget.addEventListener("dnd-drop", this, { signal });
    dropTarget.addEventListener("dnd-dragend", this, { passive: true, signal });

    element.addEventListener("itemresizestart", this, { signal });
    element.addEventListener("itemresize", this, { signal });
    element.addEventListener("itemresizeend", this, { signal });
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

  get snap() {
    return this.layoutType === "FREEFORM";
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
      case "itemresizestart":
        return this.handleResizeStart(event as PageItemEvent);
      case "itemresize":
        return this.handleResize(event as PageItemEvent);
      case "itemresizeend":
        return this.handleResizeEnd(event as PageItemEvent);
    }
  }

  private updateLayoutInfo() {
    // Calculate row heights without placeholder
    if (this.dragPlaceholder) {
      this.dragPlaceholder.style.display = "none";
    }

    const style = getComputedStyle(this.grid);
    this.gridColumnWidth = parseFloat(
      style.getPropertyValue("--grid-column-width"),
    );
    this.gridRowMinHeight = parseFloat(
      style.getPropertyValue("--grid-row-height"),
    );

    if (this.layoutType === "GRID") {
      this.gridColumnGap =
        style.columnGap === "normal" ? 0 : parseFloat(style.columnGap);
      this.gridRowGap =
        style.rowGap === "normal" ? 0 : parseFloat(style.rowGap);

      const rows = style.gridTemplateRows;
      const rowHeights = rows === "none" ? [] : rows.split(" ").map(parseFloat);
      let top = 0;
      this.gridRows = [];
      for (const height of rowHeights) {
        this.gridRows.push({ top, height });
        top += height + this.gridRowGap;
      }
    }

    if (this.dragPlaceholder) {
      this.dragPlaceholder.style.display = "";
    }

    this.gridRect = this.grid.getBoundingClientRect();

    if (this.snap) {
      this.snapPoints = getSnapPoints(
        this.element.getElementsByTagName("page-item"),
        {
          x: this.gridRect.x,
          y: this.gridRect.y,
        },
      );
    }
  }

  private getSnapX(x: number, width: number, id: string) {
    const offsets = [x, x + width];
    const snap = findSnapPoint(this.snapPoints.x, offsets, SNAP_THRESHOLD, id);
    return snap ? x + snap.delta : x;
  }

  private getColumn(x: number, width: number, id: string) {
    const snapX = this.snap ? this.getSnapX(x, width, id) : x;

    return Math.max(
      Math.round(snapX / (this.gridColumnWidth + this.gridColumnGap)),
      0,
    );
  }

  private getSnapY(y: number, height: number, id: string) {
    const offsets = [y, y + height];
    const snap = findSnapPoint(this.snapPoints.y, offsets, SNAP_THRESHOLD, id);
    return snap ? y + snap.delta : y;
  }

  private getRow(y: number, height: number, id: string) {
    const snapY = this.snap ? this.getSnapY(y, height, id) : y;

    if (this.layoutType === "GRID") {
      if (this.gridRows.length === 0) {
        return 0;
      }

      for (let i = 0; i < this.gridRows.length; i++) {
        const row = this.gridRows[i]!;
        if (snapY < row.top + row.height) {
          return i;
        }
      }

      const lastRow = this.gridRows.at(-1)!;
      const distanceFromBottom = y - (lastRow.top + lastRow.height);
      const extraRows = Math.round(
        distanceFromBottom / (this.gridRowMinHeight + this.gridRowGap),
      );
      return this.gridRows.length - 1 + extraRows;
    }

    return Math.max(
      Math.round(snapY / (this.gridRowMinHeight + this.gridRowGap)),
      0,
    );
  }

  private getPosition(event: DragDropEvent) {
    const { clientX, clientY, state } = event;
    const offsetX = clientX - this.gridRect.x - state.offsetX;
    const offsetY = clientY - this.gridRect.y - state.offsetY;
    const x = this.getColumn(offsetX, state.width, state.element.id);
    const y = this.getRow(offsetY, state.height, state.element.id);
    return { x, y };
  }

  private updateFreeformDragPosition(event: DragDropEvent<DragData>) {
    const { x, y } = this.getPosition(event);

    if (x !== this.x || y !== this.y) {
      this.x = x;
      this.y = y;

      requestAnimationFrame(() => {
        this.dragPlaceholder?.style.setProperty(
          "--placeholder-x",
          x.toString(),
        );
        this.dragPlaceholder?.style.setProperty(
          "--placeholder-y",
          y.toString(),
        );
        this.updateLayoutInfo();
      });
    }
  }

  private updateOrderedDragPosition(event: DragDropEvent<DragData>) {
    if (!this.dragPlaceholder) {
      return;
    }

    const position = this.getDragPosition(event.clientX, event.clientY);
    if (position) {
      const { previous, next } = position;
      this.afterId =
        previous instanceof HTMLElement
          ? previous.dataset.id || previous.id
          : null;
      moveBefore(this.element, this.dragPlaceholder, next);
    }
  }

  // Drag and drop

  private handleDragOver(event: DragDropEvent<DragData>) {
    event.stopPropagation();

    if (!event.state.data?.tile) {
      return;
    }

    if (this.layoutType === "FREEFORM") {
      this.updateFreeformDragPosition(event);
    } else {
      this.updateOrderedDragPosition(event);
    }
  }

  private showDragPlaceholder({
    x = 0,
    y = 0,
    width,
    height,
    rowSpan,
  }: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    rowSpan: number;
  }) {
    if (this.dragPlaceholder) {
      return;
    }

    const placeholder = document.createElement("div");
    placeholder.classList.add("drag-placeholder");

    if (this.layoutType === "FREEFORM") {
      placeholder.style.setProperty("--placeholder-x", x.toString());
      placeholder.style.setProperty("--placeholder-y", y.toString());
    }

    placeholder.style.setProperty("--placeholder-width", width.toString());
    placeholder.style.setProperty("--placeholder-height", height.toString());
    placeholder.style.setProperty("--placeholder-rows", rowSpan.toString());
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

    if (this.layoutType === "FREEFORM") {
      const { x, y } = this.getPosition(event);

      this.x = x;
      this.y = y;

      this.showDragPlaceholder({
        x,
        y,
        width: tile.width.value,
        height: tile.height.value,
        rowSpan: tile.rowSpan.value,
      });
    } else {
      this.showDragPlaceholder({
        width: tile.width.value,
        height: tile.height.value,
        rowSpan: tile.rowSpan.value,
      });
    }
  }

  private handleDragLeave() {
    this.afterId = null;
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

    try {
      if (this.layoutType === "HORIZONTAL" || this.layoutType === "VERTICAL") {
        tile.move({
          sectionId: this.sectionId,
          afterId: this.afterId,
        });
      } else {
        tile.move({
          sectionId: this.sectionId,
          x: this.x,
          y: this.y,
        });
      }

      const destination = document.getElementById(tile.id);
      if (destination) {
        destination.style.viewTransitionName = "drop";
        destination.focus({ preventScroll: true });
        requestAnimationFrame(() => {
          destination.style.viewTransitionName = "";
        });
      }
    } catch (error) {
      handleError(error);
    }
  }

  private handleDragEnd() {
    this.afterId = null;
  }

  private isElementOrdered(element: Element) {
    return (
      element !== this.dragPlaceholder && !element.matches(":popover-open")
    );
  }

  private getPreviousItem(element: Element) {
    let previous = element.previousElementSibling;

    while (previous && !this.isElementOrdered(previous)) {
      previous = previous.previousElementSibling;
    }

    return previous;
  }

  private getNextItem(element: Element) {
    let next = element.nextElementSibling;

    while (next && !this.isElementOrdered(next)) {
      next = next.nextElementSibling;
    }

    return next;
  }

  private getDragPosition(
    x: number,
    y: number,
  ): { previous: Element | null; next: Element | null } | null {
    for (const child of this.element.children) {
      if (!this.isElementOrdered(child)) {
        continue;
      }

      const rect = child.getBoundingClientRect();

      if (this.layoutType === "VERTICAL") {
        const midpoint = rect.y + rect.height / 2;

        if (y >= rect.top && y <= rect.bottom) {
          if (y < midpoint) {
            return { previous: this.getPreviousItem(child), next: child };
          } else {
            return { previous: child, next: this.getNextItem(child) };
          }
        }
      }

      if (this.layoutType === "HORIZONTAL") {
        const midpoint = rect.x + rect.width / 2;

        if (x >= rect.left && x <= rect.right) {
          if (x < midpoint) {
            return { previous: this.getPreviousItem(child), next: child };
          } else {
            return { previous: child, next: this.getNextItem(child) };
          }
        }
      }
    }

    return null;
  }

  // Resize

  private handleResizeStart(event: PageItemEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    event.stopPropagation();

    this.updateLayoutInfo();
    this.resizing = this.editor.getTile(event.target.id);
    document.body.dataset.resize = "true";
  }

  private handleResize(event: PageItemEvent) {
    if (event.defaultPrevented || !this.resizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const width = Math.max(
      Math.round(
        (event.width + this.gridColumnGap) /
          (this.gridColumnWidth + this.gridColumnGap),
      ),
      1,
    );
    const height = Math.max(
      Math.round(
        (event.height + this.gridColumnGap) /
          (this.gridRowMinHeight + this.gridColumnGap),
      ),
      1,
    );
    const block =
      height !== this.resizing.height.value ? false : this.resizing.block;

    this.resizing.width.value = width;
    this.resizing.height.value = height;

    if (typeof block === "boolean") {
      this.resizing.block.value = block;
    }

    // Handle position changes for freeform layouts (from corner/edge resize)
    if (
      this.layoutType === "FREEFORM" &&
      typeof event.x !== "undefined" &&
      typeof event.y !== "undefined"
    ) {
      const offsetX = event.x - this.gridRect.x;
      const offsetY = event.y - this.gridRect.y;
      const x = this.getColumn(offsetX, event.width, this.resizing.id);
      const y = this.getRow(offsetY, event.height, this.resizing.id);

      this.resizing.x.value = x;
      this.resizing.y.value = y;
    }
  }

  private async handleResizeEnd(event: PageItemEvent) {
    if (event.defaultPrevented || !this.resizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    delete document.body.dataset.resize;

    try {
      await this.resizing.persistPosition();
    } catch (error) {
      handleError(error);
    }

    this.resizing = null;
  }
}
