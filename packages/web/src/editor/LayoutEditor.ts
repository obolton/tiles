import { handleError } from "@/utils/errors";
import { getSnapPoints, findSnapPoint, type SnapPoints } from "@/utils/snap";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { PageItemEvent } from "@/elements/item/events";
import type { Tile } from "@/types/tiles";

export interface LayoutEditorOptions {
  element: HTMLElement;
  grid: HTMLElement;
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

interface ItemSize {
  id: string;
  width: number;
  height: number;
  block?: boolean;
}

const SNAP_THRESHOLD = 64;

export default class LayoutEditor {
  readonly editor: Editor;
  readonly sectionId: string | null;

  private readonly elementRef: WeakRef<HTMLElement>;
  private readonly gridRef: WeakRef<HTMLElement>;

  private gridRect: DOMRect;
  private gridColumnWidth = 0;
  private gridRowMinHeight = 24;
  private gridRows: RowLayout[] = [];
  private gridColumnGap = 0;
  private gridRowGap = 0;
  private x = 0;
  private y = 0;
  private size: ItemSize | null = null;
  private idForPoint?: string | null;
  private dragPlaceholder: HTMLElement | null = null;
  private snapPoints: SnapPoints = { x: [], y: [] };

  constructor({
    element,
    grid,
    dropTarget = element,
    editor,
    sectionId,
    signal,
  }: LayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.gridRef = new WeakRef(grid);
    this.editor = editor;
    this.sectionId = sectionId;

    this.gridRect = grid.getBoundingClientRect();

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

    this.gridColumnGap =
      style.columnGap === "normal" ? 0 : parseFloat(style.columnGap);
    this.gridRowGap = style.rowGap === "normal" ? 0 : parseFloat(style.rowGap);

    const rows = style.gridTemplateRows;
    const rowHeights = rows === "none" ? [] : rows.split(" ").map(parseFloat);
    let top = 0;
    this.gridRows = [];
    for (const height of rowHeights) {
      this.gridRows.push({ top, height });
      top += height + this.gridRowGap;
    }

    if (this.dragPlaceholder) {
      this.dragPlaceholder.style.display = "";
    }

    this.gridRect = this.grid.getBoundingClientRect();

    this.snapPoints = getSnapPoints(
      this.element.getElementsByTagName("page-item"),
      {
        x: this.gridRect.x,
        y: this.gridRect.y,
      },
    );
  }

  private getGridColumn(offsetX: number, width: number, id: string) {
    const offsets = [offsetX, offsetX + width];
    const snap = findSnapPoint(this.snapPoints.x, offsets, SNAP_THRESHOLD, id);
    const snapX = snap ? offsetX + snap.delta : offsetX;

    const x = Math.max(
      Math.round(snapX / (this.gridColumnWidth + this.gridColumnGap)),
      0,
    );

    return x;
  }

  private getGridRow(offsetY: number, height: number, id: string) {
    if (this.gridRows.length === 0) {
      return 0;
    }

    const offsets = [offsetY, offsetY + height];
    const snap = findSnapPoint(this.snapPoints.y, offsets, SNAP_THRESHOLD, id);
    const snapY = snap ? offsetY + snap.delta : offsetY;

    for (let i = 0; i < this.gridRows.length; i++) {
      const row = this.gridRows[i]!;
      if (snapY < row.top + row.height) {
        return i;
      }
    }

    const lastRow = this.gridRows.at(-1)!;
    const distanceFromBottom = offsetY - (lastRow.top + lastRow.height);
    const extraRows = Math.round(
      distanceFromBottom / (this.gridRowMinHeight + this.gridRowGap),
    );
    return this.gridRows.length - 1 + extraRows;
  }

  private getGridPosition(event: DragDropEvent) {
    const { clientX, clientY, state } = event;
    const offsetX = clientX - this.gridRect.x - state.offsetX;
    const offsetY = clientY - this.gridRect.y - state.offsetY;
    const x = this.getGridColumn(offsetX, state.width, state.element.id);
    const y = this.getGridRow(offsetY, state.height, state.element.id);
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

  private showDragPlaceholder({
    x,
    y,
    width,
    height,
    rowSpan,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    rowSpan: number;
  }) {
    if (this.dragPlaceholder) {
      return;
    }

    const placeholder = document.createElement("div");
    placeholder.classList.add("drag-placeholder");
    placeholder.style.setProperty("--placeholder-x", x.toString());
    placeholder.style.setProperty("--placeholder-y", y.toString());
    placeholder.style.setProperty("--placeholder-columns", width.toString());
    placeholder.style.setProperty("--placeholder-rows", rowSpan.toString());
    placeholder.style.setProperty(
      "--placeholder-height",
      height.toString() + "px",
    );
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
      height: event.state.height,
      rowSpan: tile.rowSpan.value,
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

    try {
      this.editor.positionTile({
        id: tile.id,
        sectionId: this.sectionId,
        x: this.x,
        y: this.y,
      });
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
    this.idForPoint = undefined;
  }

  private findIdForPoint(event: DragDropEvent<Tile>) {
    const { clientX, clientY, state } = event;
    const dragId = state.data?.id;

    // Look for an element under the pointer
    let element = document
      .elementsFromPoint(clientX, clientY)
      .find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element.parentElement === this.element &&
          element.id !== dragId,
      );

    if (element) {
      return element.id || null;
    }

    // If no element was found, look for the previous element in the grid
    for (const child of this.element.children) {
      if (!(child instanceof HTMLElement) || child.id === dragId) {
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

    return element?.id || null;
  }

  // Resize

  private handleResizeStart(event: PageItemEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    event.stopPropagation();

    this.updateLayoutInfo();

    const id = event.target.id ?? "";
    const width = Math.max(
      Math.round(
        (event.width + this.gridColumnGap) /
          (this.gridColumnWidth + this.gridColumnGap),
      ),
      1,
    );
    const height = Math.max(
      Math.round(event.height / this.gridRowMinHeight),
      1,
    );
    this.size = { id, width: width, height: height };

    document.body.dataset.resize = "true";
  }

  private handleResize(event: PageItemEvent) {
    if (event.defaultPrevented || !this.size) {
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
    const block = height !== this.size.height ? false : this.size.block;

    if (width !== this.size.width || height !== this.size.height) {
      this.size.width = width;
      this.size.height = height;
      this.size.block = block;

      this.editor.positionTilePreview(this.size);
    }
  }

  private async handleResizeEnd(event: PageItemEvent) {
    if (event.defaultPrevented || !this.size) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    delete document.body.dataset.resize;

    try {
      await this.editor.positionTile(this.size);
    } catch (error) {
      handleError(error);
    }

    this.size = null;
  }
}
