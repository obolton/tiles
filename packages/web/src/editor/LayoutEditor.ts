import { handleError } from "@/utils/errors";
import {
  getSnapPoints,
  findSnapPoint,
  type SnapPoint,
  type SnapPoints,
} from "@/utils/snap";
import { moveBefore } from "@/utils/dom";
import {
  createDragPlaceholder,
  getDragPosition,
} from "@/utils/drag-placeholder";
import { ASPECT_RATIOS } from "@/constants/size";
import type Page from "@/models/Page";
import type { DragDropEvent } from "@/utils/drag";
import type { PageItemEvent } from "@/elements/item/events";
import type Tile from "@/models/Tile";
import type { Layout } from "doc/types/tiles/section";

export type LayoutType = Layout;

export interface LayoutEditorOptions {
  element: HTMLElement;
  grid: HTMLElement;
  layoutType: LayoutType;
  dropTarget?: HTMLElement;
  page: Page;
  sectionId: string | null;
  signal?: AbortSignal;
}

export interface DragData {
  tile: Tile;
}

const SNAP_THRESHOLD = 16;

export default class LayoutEditor {
  static attach(options: LayoutEditorOptions): LayoutEditor {
    return new LayoutEditor(options);
  }

  readonly page: Page;
  readonly sectionId: string | null;

  layoutType: LayoutType;

  private readonly elementRef: WeakRef<HTMLElement>;
  private readonly gridRef: WeakRef<HTMLElement>;

  private gridRect: DOMRect;
  private gridColumns = 4;
  private gridColumnWidth = 0;
  private gridRowMinHeight = 24;
  private gridColumnGap = 0;
  private scale = 1;

  private beforeId: string | null = null;
  private x = 0;
  private y = 0;

  private resizing: Tile | null = null;
  private dragPlaceholder: HTMLElement | null = null;
  private snapPoints: SnapPoints = { x: [], y: [] };
  private widthSnapValues: number[] = [];

  constructor({
    element,
    grid,
    layoutType,
    dropTarget = element,
    page,
    sectionId,
    signal,
  }: LayoutEditorOptions) {
    this.page = page;
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
      this.gridColumns =
        style.gridTemplateColumns === "none"
          ? 4
          : style.gridTemplateColumns.split(" ").length;
    }

    if (this.dragPlaceholder) {
      this.dragPlaceholder.style.display = "";
    }

    this.gridRect = this.grid.getBoundingClientRect();
    this.scale =
      this.grid.offsetWidth > 0
        ? this.gridRect.width / this.grid.offsetWidth
        : 1;

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

  private getSnapY(y: number, height: number, id: string) {
    const offsets = [y, y + height];
    const snap = findSnapPoint(this.snapPoints.y, offsets, SNAP_THRESHOLD, id);
    return snap ? y + snap.delta : y;
  }

  private pixelToPercentX(px: number): number {
    return (px / this.gridRect.width) * 100;
  }

  private pixelToPercentY(py: number): number {
    return (py / this.gridRect.height) * 100;
  }

  private getPercentX(x: number, width: number, id: string, altKey: boolean) {
    // Snap in pixel space, then convert to percentage
    const shouldSnap = this.snap && !altKey;
    const snapped = shouldSnap ? this.getSnapX(x, width, id) : x;
    return Math.max(0, this.pixelToPercentX(snapped));
  }

  private getPercentY(y: number, height: number, id: string, altKey: boolean) {
    // Snap in pixel space, then convert to percentage
    const shouldSnap = this.snap && !altKey;
    const snapped = shouldSnap ? this.getSnapY(y, height, id) : y;
    return Math.max(0, this.pixelToPercentY(snapped));
  }

  private snapEdge(points: SnapPoint[], position: number, id: string): number {
    if (!this.snap) {
      return position;
    }
    const snap = findSnapPoint(points, [position], SNAP_THRESHOLD, id);
    return snap ? position + snap.delta : position;
  }

  private applyResizeSnapping(event: PageItemEvent, id: string) {
    const { rect, direction, clientX, clientY, altKey } = event;

    if (!this.snap || !direction || altKey) {
      return;
    }

    const affectsX = direction !== "n" && direction !== "s";
    const affectsY = direction !== "e" && direction !== "w";
    const movesLeft =
      direction === "nw" || direction === "w" || direction === "sw";
    const movesTop =
      direction === "nw" || direction === "n" || direction === "ne";

    if (affectsX) {
      const snappedX =
        this.snapEdge(this.snapPoints.x, clientX - this.gridRect.x, id) +
        this.gridRect.x;
      if (movesLeft) {
        rect.width = rect.right - snappedX;
        rect.x = snappedX;
      } else {
        rect.width = snappedX - rect.x;
      }
    }

    if (affectsY) {
      const snappedY =
        this.snapEdge(this.snapPoints.y, clientY - this.gridRect.y, id) +
        this.gridRect.y;
      if (movesTop) {
        rect.height = rect.bottom - snappedY;
        rect.y = snappedY;
      } else {
        rect.height = snappedY - rect.y;
      }
    }
  }

  private getPosition(event: DragDropEvent) {
    const { clientX, clientY, state, altKey } = event;
    const offsetX = clientX - this.gridRect.x - state.offsetX;
    const offsetY = clientY - this.gridRect.y - state.offsetY;

    const x = this.getPercentX(offsetX, state.width, state.element.id, altKey);
    const y = this.getPercentY(offsetY, state.height, state.element.id, altKey);
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

    const direction =
      this.layoutType === "HORIZONTAL"
        ? "horizontal"
        : this.layoutType === "GRID"
          ? "grid"
          : "vertical";

    const position = getDragPosition(
      this.element,
      event.clientX,
      event.clientY,
      direction,
      (el) => this.isElementOrdered(el),
    );

    if (position) {
      const { next } = position;
      this.beforeId =
        next instanceof HTMLElement ? next.dataset.id || next.id : null;
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
    width: number | null;
    height: number;
    rowSpan: number;
  }) {
    if (this.dragPlaceholder) {
      return;
    }

    const placeholder = createDragPlaceholder({
      x,
      y,
      width,
      height,
      rowSpan,
      freeform: this.layoutType === "FREEFORM",
    });

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

      const width = this.pixelToPercentX(event.state.width);
      const height = this.pixelToPercentY(event.state.height);

      this.showDragPlaceholder({
        x,
        y,
        width,
        height,
        rowSpan: tile.rowSpan.value,
      });
    } else if (this.layoutType === "GRID") {
      const sizing = tile.sizing.value;
      const ratio =
        sizing !== "CUSTOM" && sizing !== "AUTO"
          ? ASPECT_RATIOS[sizing]
          : event.state.width / event.state.height;
      const span = Math.min(tile.width.value ?? 1, this.gridColumns);
      this.showDragPlaceholder({
        width: null,
        height: 0,
        rowSpan: 1,
      });
      if (this.dragPlaceholder) {
        this.dragPlaceholder.style.gridColumn = `span ${span}`;
        this.dragPlaceholder.style.aspectRatio = `${ratio}`;
      }
    } else {
      this.showDragPlaceholder({
        width: tile.width.value,
        height: tile.height.value,
        rowSpan: tile.rowSpan.value,
      });
    }
  }

  private handleDragLeave() {
    this.beforeId = null;
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
      if (this.layoutType === "FREEFORM") {
        const width = this.pixelToPercentX(state.width);
        const height = this.pixelToPercentY(state.height);
        tile.move({
          parentId: this.sectionId,
          x: this.x,
          y: this.y,
          width,
          height,
        });
      } else {
        tile.move({
          parentId: this.sectionId,
          beforeId: this.beforeId,
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
    this.beforeId = null;
  }

  private isElementOrdered(element: Element) {
    return (
      element !== this.dragPlaceholder && !element.matches(":popover-open")
    );
  }

  // Resize

  private handleResizeStart(event: PageItemEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    event.stopPropagation();

    this.updateLayoutInfo();
    this.resizing = this.page.getTile(event.target.id);
    document.body.dataset.resize = "true";

    if (this.layoutType === "VERTICAL") {
      const cw = this.page.width.value;
      this.widthSnapValues = [
        cw,
        Math.round((cw * 2) / 3),
        Math.round(cw / 2),
        Math.round(cw / 3),
      ];
    }
  }

  private handleResize(event: PageItemEvent) {
    if (event.defaultPrevented || !this.resizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { rect } = event;

    if (this.layoutType === "FREEFORM") {
      this.applyResizeSnapping(event, this.resizing.id);

      const offsetX = rect.x - this.gridRect.x;
      const offsetY = rect.y - this.gridRect.y;

      this.resizing.x.value = Math.max(0, this.pixelToPercentX(offsetX));
      this.resizing.y.value = Math.max(0, this.pixelToPercentY(offsetY));
      this.resizing.width.value = Math.max(this.pixelToPercentX(rect.width), 1);
      this.resizing.height.value = Math.max(
        this.pixelToPercentY(rect.height),
        1,
      );
    } else if (this.layoutType === "GRID") {
      const columns = this.gridColumns;
      const gap = this.gridColumnGap;
      const gridWidth = this.gridRect.width / this.scale;
      const columnWidth = (gridWidth - gap * (columns - 1)) / columns;
      const cellSpan = (size: number) =>
        Math.max(
          Math.round((size / this.scale + gap) / (columnWidth + gap)),
          1,
        );
      this.resizing.width.value = Math.min(cellSpan(rect.width), columns);
      this.resizing.rowSpan.value = cellSpan(rect.height);
    } else {
      let width = Math.max(
        Math.round(
          (rect.width / this.scale + this.gridColumnGap) /
            (this.gridColumnWidth + this.gridColumnGap),
        ),
        1,
      );

      const snapped = this.widthSnapValues.find(
        (v) => Math.abs(width - v) <= 1,
      );
      if (snapped) {
        width = snapped;
      }

      const { sizing } = this.resizing;
      const ratio =
        sizing.value !== "CUSTOM" && sizing.value !== "AUTO"
          ? ASPECT_RATIOS[sizing.value]
          : undefined;

      const height = ratio
        ? Math.round(width / ratio)
        : Math.max(
            Math.round(
              (rect.height / this.scale + this.gridColumnGap) /
                (this.gridRowMinHeight + this.gridColumnGap),
            ),
            1,
          );

      this.resizing.width.value =
        width === this.page.width.value ? null : width;
      this.resizing.height.value = height;
    }
  }

  private async handleResizeEnd(event: PageItemEvent) {
    if (event.defaultPrevented || !this.resizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    delete document.body.dataset.resize;

    this.resizing = null;
  }
}
