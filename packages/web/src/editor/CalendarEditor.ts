import { addDays, daysBetween } from "@/utils/dates";
import { handleError } from "@/utils/errors";
import type CalendarGrid from "@/elements/calendar-grid/CalendarGrid";
import type Page from "@/models/Page";
import type { DragDropEvent } from "@/utils/drag";
import type { CalendarMoveEvent } from "@/elements/calendar-grid/events";
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
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<DragData>);
      case "dnd-dragleave":
      case "dnd-dragend":
        return this.handleDragEnd();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<DragData>);
      case "calendarmoveend":
        return this.handleMoveEnd(event as CalendarMoveEvent);
    }
  }

  // Drag and drop

  private handleDragOver(event: DragDropEvent<DragData>) {
    event.stopPropagation();
    const date = this.element.dateFromPoint(event.clientX, event.clientY);
    this.element.highlightDate(date);
  }

  private handleDragEnd() {
    this.element.highlightDate(null);
  }

  private handleDrop(event: DragDropEvent<DragData>) {
    event.preventDefault();
    event.stopPropagation();
    this.element.highlightDate(null);

    const tile = event.state.data?.tile;
    if (!tile) {
      return;
    }

    const targetDate = this.element.dateFromPoint(event.clientX, event.clientY);
    if (!targetDate) {
      return;
    }

    const dropDate = new Date(targetDate);
    const startDate = tile.startDate.value;

    let newStart: Date;
    let newEnd: Date;

    if (startDate) {
      const offset = daysBetween(startDate, dropDate);
      newStart = addDays(startDate, offset);
      newEnd = tile.endDate.value
        ? addDays(tile.endDate.value, offset)
        : newStart;
    } else {
      newStart = dropDate;
      newEnd = dropDate;
    }

    tile.setDates(newStart, newEnd).catch(handleError);

    if (tile.sectionId !== this.sectionId) {
      tile.move({ sectionId: this.sectionId }).catch(handleError);
    }
  }

  // Resize

  private handleMoveEnd(event: CalendarMoveEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    const pageItem = event.target.querySelector("page-item");
    if (!pageItem) {
      return;
    }

    const tile = this.page.getTile(pageItem.id);
    tile
      .setDates(new Date(event.start), new Date(event.end))
      .catch(handleError);
  }
}
