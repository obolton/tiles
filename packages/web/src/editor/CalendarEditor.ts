import { addDays, daysBetween } from "@/utils/dates";
import { handleError } from "@/utils/errors";
import type CalendarGrid from "@/elements/calendar-grid/CalendarGrid";
import type { DragDropEvent } from "@/utils/drag";
import type { DragData } from "./LayoutEditor";

export interface CalendarEditorOptions {
  element: CalendarGrid;
  sectionId: string;
  signal?: AbortSignal;
}

export default class CalendarEditor {
  static attach(options: CalendarEditorOptions): CalendarEditor {
    return new CalendarEditor(options);
  }

  private readonly element: CalendarGrid;
  private readonly sectionId: string;

  constructor({ element, sectionId, signal }: CalendarEditorOptions) {
    this.element = element;
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
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent<DragData>);
      case "dnd-dragleave":
      case "dnd-dragend":
        return this.handleDragEnd();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent<DragData>);
    }
  }

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
}
