import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";
import type { DragDropEvent } from "@/utils/drag";
import type { DragData } from "@/editor/LayoutEditor";
import type { DockEdge } from "@/models/Tile";

const DEFAULT_DOCK_SIZE = 200; // px

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

  constructor({ element, edge, editor, signal }: DockLayoutEditorOptions) {
    this.elementRef = new WeakRef(element);
    this.edge = edge;
    this.editor = editor;

    element.dataset.drop = "true";
    element.addEventListener("dnd-dragenter", this, { signal });
    element.addEventListener("dnd-dragover", this, { signal });
    element.addEventListener("dnd-dragleave", this, { signal });
    element.addEventListener("dnd-drop", this, { signal });
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

    // Allow the drop
    return true;
  }

  private handleDragOver(event: DragDropEvent<DragData>) {
    if (event.altKey) {
      return;
    }
    // Phase 2: No placeholder positioning, tiles append to end
    // Phase 3 will add reordering with placeholder position updates
  }

  private handleDragLeave() {
    // Phase 2: No placeholder to hide
    // Phase 3 will add placeholder management
  }

  private async handleDrop(event: DragDropEvent<DragData>) {
    const { state } = event;

    // Alt key bypasses dock zones
    if (event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const tile = state.data?.tile;
    if (!tile) {
      return;
    }

    try {
      // Set default dock size if not already set
      this.ensureDockSize();

      // Dock the tile to this edge
      await tile.setDock(this.edge);

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
  }

  private ensureDockSize() {
    const currentSize = this.editor.dockSizes.value[this.edge];
    if (currentSize === null) {
      this.editor.setDockSizes({ [this.edge]: DEFAULT_DOCK_SIZE });
    }
  }
}
