import { daysBetween } from "@/utils/dates";
import type CalendarGrid from "@/elements/calendar-grid/CalendarGrid";
import type Page from "@/models/Page";
import type { DragDropEvent } from "@/utils/drag";
import type { CalendarEvent } from "@/elements/calendar-grid/events";
import type { DragData } from "./LayoutEditor";

export interface CalendarEditorOptions {
  element: CalendarGrid;
  page: Page;
  sectionId: string;
  signal?: AbortSignal;
}

export default class CalendarEditor {
  static attach(options: CalendarEditorOptions): CalendarEditor {
    return new CalendarEditor(options);
  }

  private readonly element: CalendarGrid;
  private readonly page: Page;
  private readonly sectionId: string;
  private drag: {
    days: number;
    start: string;
    end: string;
  } | null = null;

  constructor({ element, page, sectionId, signal }: CalendarEditorOptions) {
    this.element = element;
    this.page = page;
    this.sectionId = sectionId;

    element.dataset.drop = "true";
    element.addEventListener("dnd-dragover", this, { signal });
    element.addEventListener("dnd-dragenter", this, { passive: true, signal });
    element.addEventListener("dnd-dragleave", this, { signal });
    element.addEventListener("dnd-drop", this, { signal });
    element.addEventListener("dnd-dragend", this, { passive: true, signal });

    element.addEventListener("calendarmoveend", this, { signal });
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
      case "calendarmoveend":
        return this.handleMoveEnd(event as CalendarEvent);
    }
  }

  // Drag and drop

  private handleDragEnter(event: DragDropEvent<DragData>) {
    const tile = event.state.data?.tile;
    if (!tile) {
      return;
    }
    const start = tile.startDate.value;
    const end = tile.endDate.value;
    this.drag = {
      days: start && end ? daysBetween(new Date(start), new Date(end)) : 0,
      start: "",
      end: "",
    };
  }

  private handleDragOver(event: DragDropEvent<DragData>) {
    event.stopPropagation();
    if (!this.drag) {
      return;
    }
    const dates = this.element.dateRangeFromPoint(
      event.clientX,
      event.clientY,
      this.drag.days,
    );
    if (dates) {
      this.drag.start = dates.start;
      this.drag.end = dates.end;
      this.element.showPlaceholder(dates.start, dates.end);
    }
  }

  private handleDragEnd() {
    this.element.hidePlaceholder();
    this.drag = null;
  }

  private handleDrop(event: DragDropEvent<DragData>) {
    event.preventDefault();
    event.stopPropagation();
    this.element.hidePlaceholder();

    const tile = event.state.data?.tile;
    if (!tile || !this.drag?.start) {
      this.drag = null;
      return;
    }

    const { start, end } = this.drag;
    this.drag = null;

    tile.setDates(start, end);

    if (tile.parentId.value !== this.sectionId) {
      tile.move({ parentId: this.sectionId });
    }
  }

  // Resize

  private handleMoveEnd(event: CalendarEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    const pageItem = event.target.querySelector("page-item");
    if (!pageItem) {
      return;
    }

    const tile = this.page.getTile(pageItem.id);
    tile.setDates(event.start, event.end);
  }
}
