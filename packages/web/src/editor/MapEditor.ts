import { handleError } from "@/utils/errors";
import type MapView from "@/elements/maps/MapView";
import type Page from "@/models/Page";
import type { DragDropEvent } from "@/utils/drag";
import type { DragData } from "./LayoutEditor";

export interface MapEditorOptions {
  element: MapView;
  page: Page;
  sectionId: string;
  signal?: AbortSignal;
}

interface DragState {
  lat: number;
  long: number;
}

export default class MapEditor {
  static attach(options: MapEditorOptions): MapEditor {
    return new MapEditor(options);
  }

  private readonly element: MapView;
  private readonly page: Page;
  private readonly sectionId: string;
  private drag: DragState | null = null;

  constructor({ element, page, sectionId, signal }: MapEditorOptions) {
    this.element = element;
    this.page = page;
    this.sectionId = sectionId;

    element.dataset.drop = "true";
    element.addEventListener("dnd-dragover", this, { signal });
    element.addEventListener("dnd-dragenter", this, { passive: true, signal });
    element.addEventListener("dnd-dragleave", this, { signal });
    element.addEventListener("dnd-drop", this, { signal });
    element.addEventListener("dnd-dragend", this, { passive: true, signal });
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent<DragData>);
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<DragData>);
      case "dnd-dragleave":
      case "dnd-dragend":
        return this.handleDragEnd();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<DragData>);
    }
  }

  private handleDragEnter(event: DragDropEvent<DragData>) {
    const tile = event.state.data?.tile;
    if (!tile) {
      return;
    }
    event.stopPropagation();
    this.drag = { lat: 0, long: 0 };
  }

  private handleDragOver(event: DragDropEvent<DragData>) {
    event.stopPropagation();
    if (!this.drag) {
      return;
    }

    const rect = this.element.getBoundingClientRect();
    const coordinates = this.element.unproject({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    this.drag.lat = coordinates.lat;
    this.drag.long = coordinates.long;
  }

  private handleDragEnd() {
    this.drag = null;
  }

  private handleDrop(event: DragDropEvent<DragData>) {
    event.preventDefault();
    event.stopPropagation();

    const tile = event.state.data?.tile;
    if (!tile || !this.drag) {
      this.drag = null;
      return;
    }

    const { lat, long } = this.drag;
    this.drag = null;

    tile.setCoordinates({ lat, long }).catch(handleError);

    if (tile.sectionId !== this.sectionId) {
      tile.move({ parentId: this.sectionId }).catch(handleError);
    }
  }
}
