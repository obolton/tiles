import Column from "./Column";
import Row from "./Row";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { TableEvent } from "./events";
import { makeDraggable } from "@/utils/drag";
import { moveBefore } from "@/utils/dom";
import { moveElement } from "@/utils/arrays";
import { getFocusedElementWithin } from "@/utils/focus";
import css from "./TableView.css?inline";
import type { ResizeEvent } from "@/elements/resize/events";
import type { DragDropEvent } from "@/utils/drag";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface TableViewAttributes {
  columns: number;
  rows: number;
  editable?: boolean;
}

export interface Cell {
  row: Row;
  column: Column;
}

export interface VisibleCell extends Cell {
  element: HTMLElement;
}

export type RangeSelection = {
  type: "cells";
  anchor: Cell;
  focus: Cell;
};

export type ColumnSelection = {
  type: "columns";
  from: Column;
  to?: Column;
};

export type RowSelection = {
  type: "rows";
  from: Row;
  to?: Row;
};

export type Selection = RangeSelection | ColumnSelection | RowSelection;

function defaultGetColumn() {
  return { width: 160 };
}

function defaultGetRow() {
  return { height: 32 };
}

const HEADER_SIZE = 32;

export default class TableView extends HTMLElement {
  static readonly observedAttributes: (keyof TableViewAttributes)[] = [
    "columns",
    "rows",
    "editable",
  ] as const;

  #columns = 0;
  #rows = 0;
  #editable = false;

  readonly selection = new Set<Selection>();
  getColumn: (index: number) => { id?: string; width: number } =
    defaultGetColumn;
  getRow: (index: number) => { id?: string; height: number } = defaultGetRow;
  updateCell?: (row: number, column: number, element: Element) => void;

  private scrollContainer?: HTMLElement;
  private contents: HTMLElement;
  private contentsSlot: HTMLSlotElement;
  private table: HTMLTableElement | null = null;
  private colGroup: HTMLTableColElement | null = null;
  private tableHead: HTMLTableSectionElement | null = null;
  private tableBody: HTMLTableSectionElement | null = null;
  private firstVisibleRow = 0;
  private firstVisibleColumn = 0;
  private resizeObserver?: ResizeObserver;
  private translateX = 0;
  private translateY = 0;
  private width = 0;
  private height = 0;
  private contentWidth = 0;
  private contentHeight = 0;
  private buffer: HTMLElement[] = [];
  private rowBuffer: HTMLTableRowElement[] = [];
  private visibleColumns: Column[] = [];
  private visibleRows: Row[] = [];
  private horizontalBufferSize = 0;
  private verticalBufferSize = 0;
  private isDraggingRange = false;
  private rangeSelection: RangeSelection | null = null;
  private virtualize = false;
  private dropIndicator: HTMLElement | null = null;
  private editAbortController: AbortController | null = null;

  get columns() {
    return this.#columns;
  }

  set columns(value: number) {
    if (value !== this.#columns) {
      this.#columns = value;
      this.update();
    }
  }

  get editable() {
    return this.#editable;
  }

  set editable(value: boolean) {
    if (value === this.#editable) {
      return;
    }

    this.#editable = value;

    if (value) {
      this.editAbortController = new AbortController();
    } else {
      this.editAbortController?.abort();
      this.editAbortController = null;
    }

    this.updateCellTabIndex();
    this.updateHeaders();

    if (!value) {
      this.clearSelection();
    }
  }

  get header() {
    if (!this.tableHead) {
      throw new Error("Table is not initialized");
    }
    return this.tableHead;
  }

  get body() {
    if (!this.tableBody) {
      throw new Error("Table is not initialized");
    }
    return this.tableBody;
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];

    this.contentsSlot = document.createElement("slot");
    shadow.appendChild(this.contentsSlot);

    this.contents = this;

    this.addEventListener("keydown", this);
    this.addEventListener("pointerdown", this);
    this.addEventListener("pointerup", this, { passive: true });
    this.addEventListener("dnd-dragstart", this);
    this.addEventListener("dnd-dragend", this);
    this.addEventListener("dnd-dragenter", this);
    this.addEventListener("dnd-dragover", this);
    this.addEventListener("dnd-drop", this);
    this.addEventListener("focusout", this);
  }

  enableVirtualization() {
    if (this.virtualize) {
      throw new Error("Virtualization is already enabled");
    }

    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    this.virtualize = true;

    this.scrollContainer = document.createElement("div");
    this.scrollContainer.id = "scroll-container";
    this.scrollContainer.tabIndex = -1;
    this.contents = document.createElement("div");
    this.contents.id = "contents";
    this.contents.appendChild(this.contentsSlot);

    this.scrollContainer.appendChild(this.contents);
    this.shadowRoot?.appendChild(this.scrollContainer);

    const rect = this.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.horizontalBufferSize = this.width / 4;
    this.verticalBufferSize = this.height / 2;

    const firstRow = this.tableBody.rows[0];
    const firstColumn = this.colGroup.children[1] as
      | HTMLTableColElement
      | undefined;

    this.firstVisibleRow = firstRow?.ariaRowIndex
      ? parseInt(firstRow.ariaRowIndex, 10)
      : 0;
    this.firstVisibleColumn = firstColumn?.dataset.index
      ? parseInt(firstColumn.dataset.index, 10)
      : 0;

    for (let i = 1; i < this.colGroup.childElementCount; i++) {
      const column = this.colGroup.children[i] as HTMLTableColElement;
      const { width } = column.getBoundingClientRect();
      this.visibleColumns.push(
        new Column({
          table: this,
          id: column.dataset.id,
          width,
          element: column,
        }),
      );
    }

    for (const row of this.tableBody.rows) {
      const { height } = row.getBoundingClientRect();
      this.visibleRows.push(
        new Row({
          table: this,
          id: row.dataset.id,
          height,
          element: row,
        }),
      );
    }

    this.contentWidth = this.contents.offsetWidth;
    this.contentHeight = this.contents.offsetHeight;

    this.fillCellBuffer();
    this.fillRowBuffer();

    this.updateCellTabIndex();
    this.updateHeaders();

    this.reposition();

    this.addEventListener("scroll", this, { passive: true });

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );
    this.resizeObserver.observe(this, { box: "border-box" });
  }

  connectedCallback() {
    this.table = this.querySelector("table");
    if (!this.table) {
      this.table = document.createElement("table");
      this.appendChild(this.table);
    }

    this.colGroup = this.table.querySelector("colgroup");
    if (!this.colGroup) {
      this.colGroup = document.createElement("colgroup");
      this.table.prepend(this.colGroup);
    }

    if (this.colGroup.childElementCount === 0) {
      const col = document.createElement("col");
      col.style.width = HEADER_SIZE + "px";
      this.colGroup.appendChild(col);
    }

    this.tableHead = this.table.createTHead();

    if (this.tableHead.rows.length === 0) {
      this.tableHead.insertRow();
    }

    if (this.tableHead.rows[0]!.childElementCount === 0) {
      const th = document.createElement("th");
      th.scope = "colgroup";
      this.tableHead.rows[0]!.appendChild(th);
    }

    this.tableBody = this.table.tBodies[0] ?? null;
    if (!this.tableBody) {
      this.tableBody = this.table.createTBody();
    }

    this.updateCellTabIndex();

    this.enableVirtualization();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.editAbortController?.abort();
    this.editAbortController = null;
  }

  attributeChangedCallback(
    name: keyof TableViewAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "columns":
        this.#columns = value === null ? 0 : parseInt(value, 10);
        this.update();
        break;
      case "rows":
        this.#rows = value === null ? 0 : parseInt(value, 10);
        this.update();
        break;
      case "editable":
        this.editable = value !== null;
        break;
    }
  }

  resizeObserverCallback(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      const size = entry.borderBoxSize[0];
      if (!size) {
        continue;
      }
      this.width = size.inlineSize;
      this.height = size.blockSize;
      this.horizontalBufferSize = this.width / 4;
      this.verticalBufferSize = this.height / 2;
    }
  }

  // Event handling

  handleEvent(event: Event) {
    switch (event.type) {
      case "scroll":
        return this.handleScroll();
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "pointerup":
        return this.handlePointerUp(event as PointerEvent);
      case "pointerover":
        return this.handlePointerOver(event as PointerEvent);
      case "resizeend":
        return this.handleResizeEnd(event as ResizeEvent);
      case "dnd-dragstart":
        return this.handleDragStart(event as DragDropEvent);
      case "dnd-dragend":
        return this.handleDragEnd();
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent);
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent);
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent);
      case "focusout":
        return this.handleFocusOut(event as FocusEvent);
    }
  }

  private handleScroll() {
    const scrollTop = this.scrollTop;
    this.update();
    this.scrollTop = scrollTop;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!(event.target instanceof HTMLTableCellElement)) {
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        this.closest<HTMLElement>("[tabindex]")?.focus({
          preventScroll: true,
        });
        break;

      case "Tab":
        event.preventDefault();
        if (event.shiftKey) {
          this.focusCellBefore();
        } else {
          this.focusCellAfter();
        }
        break;

      case "ArrowLeft":
        event.preventDefault();
        this.focusCellBefore(event.shiftKey);
        break;

      case "ArrowRight":
        event.preventDefault();
        this.focusCellAfter(event.shiftKey);
        break;

      case "ArrowUp":
        event.preventDefault();
        this.focusCellAbove(event.shiftKey);
        break;

      case "Enter":
      case "ArrowDown":
        event.preventDefault();
        this.focusCellBelow(event.shiftKey);
        break;

      case "Delete":
      case "Backspace":
        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(
          new TableEvent("cleartableselection", {
            bubbles: true,
            cancelable: true,
          }),
        );
        break;
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || !this.editable) {
      return;
    }

    const target =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLTableCellElement>("th, td")
        : null;

    if (!target) {
      this.clearSelection();
      return;
    }

    // Column selection
    if (
      target.tagName === "TH" &&
      target.scope === "col" &&
      target.ariaColIndex
    ) {
      event.stopPropagation();
      const index =
        Array.prototype.indexOf.call(target.parentElement!.children, target) -
        1;
      const column = this.visibleColumns[index];
      if (column) {
        const selection: ColumnSelection = { type: "columns", from: column };
        if (event.shiftKey) {
          this.addSelection(selection);
        } else {
          this.setSelection(selection);
        }
      }
      return;
    }

    // Row selection
    if (
      target.tagName === "TH" &&
      target.scope === "row" &&
      target.parentElement?.ariaRowIndex
    ) {
      event.stopPropagation();
      const element = target.parentElement as HTMLTableRowElement;
      const selection: RowSelection = {
        type: "rows",
        from: new Row({ table: this, id: element.dataset.id, element }),
      };
      if (event.shiftKey) {
        this.addSelection(selection);
      } else {
        this.setSelection(selection);
      }
      return;
    }

    // Cell selection
    if (
      target.tagName === "TD" &&
      target.ariaColIndex &&
      target.parentElement?.ariaRowIndex
    ) {
      event.stopPropagation();
      const anchor = this.getCellInfo(target);
      const selection: RangeSelection = {
        type: "cells",
        anchor,
        focus: anchor,
      };
      if (event.shiftKey) {
        this.addSelection(selection);
      } else {
        this.setSelection(selection);
      }
      this.startDraggingRangeSelection();
      return;
    }

    this.clearSelection();
  }

  private handlePointerUp(event: PointerEvent) {
    if (event.button === PRIMARY_MOUSE_BUTTON && this.isDraggingRange) {
      this.stopDraggingRangeSelection();
    }
  }

  private handlePointerOver(event: PointerEvent) {
    if (!this.isDraggingRange || !this.rangeSelection) {
      return;
    }

    const { target } = event;
    const cell = target instanceof HTMLElement ? target.closest("td") : null;
    if (!cell) {
      return;
    }

    this.rangeSelection.focus = this.getCellInfo(cell);
    this.redrawSelection();
  }

  private handleResizeEnd(event: ResizeEvent) {
    if (!this.colGroup) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const th = target.closest("th");
    if (!th) {
      return;
    }

    const columnIndex =
      Array.prototype.indexOf.call(th.parentElement!.children, th) - 1;

    const column = this.visibleColumns[columnIndex]!;

    const width = column.width + event.x;
    this.dispatchEvent(new TableEvent("resizetablecolumn", { column, width }));

    column.element.style.width = width + "px";
    column.width = width;

    this.update();
  }

  // Drag and drop

  private handleDragStart(event: DragDropEvent) {
    const element = event.state.element;

    if (element.tagName === "TH") {
      if (this.editable) {
        this.dataset.drop = "true";
      } else {
        event.preventDefault();
      }
    }
  }

  private handleDragEnd() {
    delete this.dataset.drop;
  }

  private handleDragEnter(event: DragDropEvent) {
    const element = event.state.element;

    if (element.tagName !== "TH" || !this.contains(element)) {
      event.preventDefault();
    }
  }

  private showDropIndicator(column: boolean) {
    if (this.dropIndicator) {
      return this.dropIndicator;
    }
    this.dropIndicator = document.createElement("div");
    this.dropIndicator.id = "drop-indicator";
    this.dropIndicator.classList.add(column ? "vertical" : "horizontal");
    this.contents.appendChild(this.dropIndicator);
    return this.dropIndicator;
  }

  private hideDropIndicator() {
    this.dropIndicator?.remove();
    this.dropIndicator = null;
  }

  private handleDragOver(event: DragDropEvent) {
    const { element } = event.state;

    if (
      !(element instanceof HTMLTableCellElement) ||
      element.tagName !== "TH" ||
      !this.contains(element)
    ) {
      return;
    }

    if (element.scope === "col") {
      const { offset } = this.getColumnDropTarget(event.clientX);
      const indicator = this.showDropIndicator(true);
      requestAnimationFrame(() => {
        indicator.style.setProperty(
          "--translate-x",
          HEADER_SIZE + offset + "px",
        );
      });
    }

    if (element.scope === "row") {
      const { offset } = this.getRowDropTarget(event.clientY);
      const indicator = this.showDropIndicator(false);
      requestAnimationFrame(() => {
        indicator.style.setProperty(
          "--translate-y",
          HEADER_SIZE + offset + "px",
        );
      });
    }
  }

  private getColumnDropTarget(clientX: number) {
    if (!this.colGroup) {
      throw new Error("Table is not initialized");
    }

    const { left } = this.contents.getBoundingClientRect();
    let index = -1;
    let offset = 0;

    for (const column of this.visibleColumns) {
      const midpoint = left + HEADER_SIZE + offset + column.width / 2;
      if (clientX < midpoint) {
        break;
      }

      index++;
      offset += column.width;
    }

    return { index, offset };
  }

  private getRowDropTarget(clientY: number) {
    if (!this.tableBody) {
      throw new Error("Table is not initialized");
    }

    const { top } = this.contents.getBoundingClientRect();
    let index = -1;
    let offset = 0;

    for (const row of this.tableBody.rows) {
      if (!row.ariaRowIndex) {
        continue;
      }

      const { height } = row.getBoundingClientRect();
      const midpoint = top + HEADER_SIZE + offset + height / 2;
      if (clientY < midpoint) {
        break;
      }

      index++;
      offset += height;
    }

    return { index, offset };
  }

  private handleDrop(event: DragDropEvent) {
    const element = event.state.element;

    if (
      !this.colGroup ||
      !this.tableBody ||
      !(element instanceof HTMLTableCellElement) ||
      element.tagName !== "TH" ||
      !this.contains(element)
    ) {
      return;
    }

    if (element.scope === "col" && element.ariaColIndex) {
      const visibleIndex =
        Array.prototype.indexOf.call(element.parentElement!.children, element) -
        1;
      const column = this.visibleColumns[visibleIndex]!;
      const { index } = this.getColumnDropTarget(event.clientX);

      this.hideDropIndicator();

      const allowMove = this.dispatchEvent(
        new TableEvent("movetablecolumn", {
          column,
          afterIndex: index,
          cancelable: true,
        }),
      );

      if (allowMove) {
        this.moveColumn(column, index);
      }

      return;
    }

    if (element.scope === "row" && element.parentElement?.ariaRowIndex) {
      const rowElement = element.parentElement as HTMLTableRowElement;
      const { index } = this.getRowDropTarget(event.clientY);
      const row = new Row({
        table: this,
        id: rowElement.dataset.id,
        element: rowElement,
      });

      this.hideDropIndicator();

      const allowMove = this.dispatchEvent(
        new TableEvent("movetablerow", {
          row,
          afterIndex: index,
          cancelable: true,
        }),
      );

      if (allowMove) {
        this.moveRow(row, index);
        this.setSelection({
          type: "rows",
          from: this.getRowAtIndex(index + 1),
        });
      }

      return;
    }
  }

  // Focus

  private handleFocusOut(event: FocusEvent) {
    const { relatedTarget } = event;
    if (!(relatedTarget instanceof Node) || !this.contains(relatedTarget)) {
      this.clearSelection();
    }
  }

  // Cell info

  private getCellInfo(element: HTMLTableCellElement): Cell {
    const row = element.parentElement;
    if (!(row instanceof HTMLTableRowElement)) {
      throw new Error("Cell is disconnected");
    }
    const columnIndex = Array.prototype.indexOf.call(row.children, element) - 1;
    return {
      column: this.visibleColumns[columnIndex]!,
      row: new Row({ table: this, id: row.dataset.id, element: row }),
    };
  }

  // TODO: Refer to rows by data, rather than element
  private getRowAtIndex(index: number) {
    if (!this.tableBody) {
      throw new Error("Table is not initialized");
    }
    const element = this.tableBody.rows[index];
    if (!element) {
      throw new Error(`Invalid row index: ${index}`);
    }
    return new Row({ table: this, id: element.dataset.id, element });
  }

  private getColumnAtIndex(index: number) {
    const column = this.visibleColumns[index];
    if (!column) {
      throw new Error(`Invalid column index: ${index}`);
    }
    return column;
  }

  // Focus and selection

  private updateCellTabIndex() {
    if (this.editable) {
      this.table?.querySelectorAll("td").forEach((cell) => {
        cell.setAttribute("tabindex", "-1");
      });
    } else {
      this.table
        ?.querySelectorAll("td[tabindex]")
        .forEach((cell) => cell.removeAttribute("tabindex"));
    }
  }

  private setSelection(selection: Selection) {
    this.selection.clear();
    this.selection.add(selection);
    this.rangeSelection = "anchor" in selection ? selection : null;
    this.redrawSelection();
  }

  private addSelection(selection: Selection) {
    this.selection.add(selection);
    this.rangeSelection = "anchor" in selection ? selection : null;
    this.redrawSelection();
  }

  private clearSelection() {
    this.selection.clear();
    this.stopDraggingRangeSelection();
    this.rangeSelection = null;
    this.redrawSelection();

    const focused = getFocusedElementWithin(this);
    if (focused instanceof HTMLElement) {
      focused.blur();
    }
  }

  private startDraggingRangeSelection() {
    this.isDraggingRange = true;
    this.addEventListener("pointerover", this, { passive: true });
  }

  private stopDraggingRangeSelection() {
    this.isDraggingRange = false;
    this.removeEventListener("pointerover", this);
  }

  private redrawSelection() {
    for (const selected of Array.from(
      this.getElementsByClassName("selected"),
    )) {
      selected.classList.remove("selected");
    }

    for (const selection of this.selection) {
      switch (selection.type) {
        case "cells":
          this.drawRangeSelection(selection);
          break;
        case "columns":
          this.drawColumnSelection(selection);
          break;
        case "rows":
          this.drawRowSelection(selection);
          break;
      }
    }
  }

  private drawRangeSelection(selection: RangeSelection) {
    const startRow = Math.min(
      selection.anchor.row.index,
      selection.focus.row.index,
    );
    const endRow = Math.max(
      selection.anchor.row.index,
      selection.focus.row.index,
    );
    const startColumn = Math.min(
      selection.anchor.column.index,
      selection.focus.column.index,
    );
    const endColumn = Math.max(
      selection.anchor.column.index,
      selection.focus.column.index,
    );

    const startVisibleRow = Math.max(startRow, this.firstVisibleRow);
    const endVisibleRow = Math.min(
      endRow,
      this.firstVisibleRow + this.visibleRows.length,
    );
    const startVisibleColumn = Math.max(startColumn, this.firstVisibleColumn);
    const endVisibleColumn = Math.min(
      endColumn,
      this.firstVisibleColumn + this.visibleColumns.length,
    );

    for (let row = startVisibleRow; row <= endVisibleRow; row++) {
      for (
        let column = startVisibleColumn;
        column <= endVisibleColumn;
        column++
      ) {
        this.querySelector(
          `tr[aria-rowindex="${row}"] > td[aria-colindex="${column}"]`,
        )?.classList.add("selected");
      }
    }
  }

  private drawColumnSelection(selection: ColumnSelection) {
    const { from } = selection;
    from.element.classList.add("selected");
    from.header?.classList.add("selected");
  }

  private drawRowSelection(selection: RowSelection) {
    const { from } = selection;
    from.element.classList.add("selected");
  }

  private getSelectionFocus() {
    const selection = Array.from(this.selection)[0];
    return selection && "focus" in selection ? selection.focus : null;
  }

  private focusCellBefore(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    const { row, column } = focus;
    const cell = {
      row,
      column: this.getColumnAtIndex(Math.max(column.index - 1, 0)),
    };
    this.moveSelectionFocus(cell, expandSelection);
  }

  private focusCellAfter(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    const { row, column } = focus;
    const cell = {
      row,
      column: this.getColumnAtIndex(
        Math.min(column.index + 1, this.#columns - 1),
      ),
    };
    this.moveSelectionFocus(cell, expandSelection);
  }

  private focusCellAbove(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    const { row, column } = focus;
    const cell = {
      row: this.getRowAtIndex(Math.max(row.index - 1, 0)),
      column,
    };
    this.moveSelectionFocus(cell, expandSelection);
  }

  private focusCellBelow(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    const { row, column } = focus;
    const cell = {
      row: this.getRowAtIndex(Math.min(row.index + 1, this.#rows - 1)),
      column,
    };
    this.moveSelectionFocus(cell, expandSelection);
  }

  private moveSelectionFocus(cell: Cell, expandSelection = false) {
    if (expandSelection && this.rangeSelection) {
      this.rangeSelection.focus = cell;
      this.redrawSelection();
    } else {
      this.setSelection({ type: "cells", anchor: cell, focus: cell });
      this.querySelector<HTMLTableCellElement>(
        `tr[aria-rowindex="${cell.row.index}"] > td[aria-colindex="${cell.column.index}"]`,
      )?.focus();
    }
  }

  // Column sizing

  private getColumnSpan(start: number, columns: number) {
    let width = 0;
    for (let i = 0; i < columns; i++) {
      width += this.getColumn(start + i).width;
    }
    return width;
  }

  // Virtualization

  private fillRowBuffer() {
    const bufferSize = this.visibleRows.length;
    for (let i = this.rowBuffer.length; i < bufferSize; i++) {
      this.rowBuffer.push(this.createRow());
    }
  }

  private fillCellBuffer() {
    const bufferSize = this.visibleColumns.length * 10;
    for (let i = this.buffer.length; i < bufferSize; i++) {
      this.buffer.push(this.createCell());
    }
  }

  private createRow() {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    makeDraggable(th, { constrain: "vertical", clone: true });
    tr.appendChild(th);
    return tr;
  }

  private createCell() {
    const cell = document.createElement("td");
    return cell;
  }

  private getCell(row: number, column: number) {
    if (this.buffer.length === 0) {
      this.fillCellBuffer();
    }

    const cell = this.buffer.pop()!;
    cell.ariaColIndex = column.toString();
    if (this.editable) {
      cell.setAttribute("tabindex", "-1");
    }
    this.updateCell?.(row, column, cell);

    return cell;
  }

  private recycleCell(cell: HTMLTableCellElement) {
    cell.remove();
    cell.replaceChildren();
    cell.classList.remove("selected");
    cell.removeAttribute("tabindex");
    cell.ariaColIndex = null;
    this.buffer.push(cell);
  }

  private recycleRow(row: HTMLTableRowElement) {
    row.remove();
    row.classList.remove("selected");
    row.ariaRowIndex = null;
    delete row.dataset.id;

    for (const cell of Array.from(row.cells)) {
      if (cell.tagName === "TD") {
        this.recycleCell(cell);
      }
    }

    this.rowBuffer.push(row);
  }

  private getRowFromBuffer() {
    if (this.rowBuffer.length === 0) {
      this.fillRowBuffer();
    }
    return this.rowBuffer.pop()!;
  }

  private insertColumn(
    position: number,
    columnIndex: number,
    width: number,
    id?: string,
  ) {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const col = document.createElement("col");
    col.dataset.index = columnIndex.toString();
    col.style.width = width + "px";
    this.colGroup.insertBefore(
      col,
      this.colGroup.children[position + 1] ?? null,
    );

    const th = document.createElement("th");
    th.scope = "col";
    th.ariaColIndex = columnIndex.toString();
    th.appendChild(this.createResizeHandle());
    makeDraggable(th, { constrain: "horizontal", clone: true });
    const headerRow = this.tableHead.rows[0]!;
    headerRow.insertBefore(th, headerRow.children[position + 1] ?? null);

    const rows = this.tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const cell = this.getCell(this.firstVisibleRow + i, columnIndex);
      row.insertBefore(cell, row.children[position + 1] ?? null);
    }

    const column = new Column({ table: this, id, width, element: col });
    this.visibleColumns.splice(position, 0, column);
  }

  private insertRow(
    position: number,
    rowIndex: number,
    height: number,
    id?: string,
  ) {
    if (!this.tableBody) {
      return;
    }

    const cells = [];
    for (let i = 0; i < this.visibleColumns.length; i++) {
      const cell = this.getCell(rowIndex, this.firstVisibleColumn + i);
      cells.push(cell);
    }

    const element = this.getRowFromBuffer();
    if (element.id) {
      element.dataset.id = id;
    }
    element.style.height = height + "px";
    element.ariaRowIndex = rowIndex.toString();
    element.append(...cells);
    this.tableBody.insertBefore(
      element,
      this.tableBody.children[position] ?? null,
    );

    const row = new Row({ table: this, id, height, element });
    this.visibleRows.splice(position, 0, row);
  }

  private fillTop() {
    while (
      this.firstVisibleRow > 0 &&
      this.scrollTop - this.translateY < this.verticalBufferSize
    ) {
      const index = this.firstVisibleRow - 1;
      const { id, height } = this.getRow(index);
      this.insertRow(0, index, height, id);
      this.firstVisibleRow--;
      this.translateY -= height;
      this.contentHeight += height;
    }

    this.reposition();
  }

  private fillBottom() {
    while (
      this.firstVisibleRow + this.visibleRows.length < this.#rows &&
      this.translateY - this.scrollTop + this.contentHeight - this.height <
        this.verticalBufferSize
    ) {
      const index = this.firstVisibleRow + this.visibleRows.length;
      const { id, height } = this.getRow(index);
      this.insertRow(this.visibleRows.length, index, height, id);
      this.contentHeight += height;
    }
  }

  private fillLeft() {
    while (
      this.firstVisibleColumn > 0 &&
      this.scrollLeft - this.translateX < this.horizontalBufferSize
    ) {
      const index = this.firstVisibleColumn - 1;
      const { id, width } = this.getColumn(index);
      this.insertColumn(0, index, width, id);
      this.firstVisibleColumn--;
      this.translateX -= width;
      this.contentWidth += width;
    }

    this.reposition();
  }

  private fillRight() {
    while (
      this.firstVisibleColumn + this.visibleColumns.length < this.#columns &&
      this.translateX - this.scrollLeft + this.contentWidth - this.width <
        this.horizontalBufferSize
    ) {
      const index = this.firstVisibleColumn + this.visibleColumns.length;
      const { id, width } = this.getColumn(index);
      this.insertColumn(this.visibleColumns.length, index, width, id);
      this.contentWidth += width;
    }
  }

  private drainTop() {
    let row = this.visibleRows[0];

    while (
      row &&
      this.scrollTop - this.translateY - row.height > this.verticalBufferSize
    ) {
      this.recycleRow(row.element);
      this.visibleRows.shift();
      this.firstVisibleRow++;
      this.contentHeight -= row.height;
      this.translateY += row.height;

      row = this.visibleRows[0];
    }

    this.reposition();
  }

  private drainBottom() {
    const bottom = this.scrollTop - this.translateY + this.height;
    let row = this.visibleRows.at(-1);

    while (
      row &&
      this.contentHeight - bottom - row.height > this.verticalBufferSize
    ) {
      this.recycleRow(row.element);
      this.visibleRows.pop();
      this.contentHeight -= row.height;

      row = this.visibleRows.at(-1);
    }
  }

  private drainLeft() {
    if (!this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    let column = this.visibleColumns[0];

    while (
      column &&
      this.scrollLeft - this.translateX - column.width >
        this.horizontalBufferSize
    ) {
      column.element.remove();
      column.header?.remove();

      for (const row of rows) {
        const cell = row.cells[1];
        if (cell) {
          this.recycleCell(cell);
        }
      }

      this.visibleColumns.shift();
      this.firstVisibleColumn++;
      this.contentWidth -= column.width;
      this.translateX += column.width;

      column = this.visibleColumns[0];
    }

    this.reposition();
  }

  private drainRight() {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const right = this.scrollLeft - this.translateX + this.width;
    let column = this.visibleColumns.at(-1);

    while (
      column &&
      this.contentWidth - right - column.width > this.horizontalBufferSize
    ) {
      column.element.remove();
      column.header?.remove();

      for (const row of rows) {
        const cell = row.cells[row.cells.length - 1];
        if (cell) {
          this.recycleCell(cell);
        }
      }

      this.visibleColumns.pop();
      this.contentWidth -= column.width;

      column = this.visibleColumns.at(-1);
    }
  }

  private update() {
    this.drainTop();
    this.fillTop();

    this.drainBottom();
    this.fillBottom();

    this.drainLeft();
    this.fillLeft();

    this.drainRight();
    this.fillRight();
  }

  private reposition() {
    if (!this.scrollContainer) {
      return;
    }

    const width = this.getColumnSpan(0, this.#columns);
    const averageRowHeight = this.contentHeight / this.visibleRows.length;
    const height = this.#rows * averageRowHeight;
    this.translateY = this.firstVisibleRow * averageRowHeight;

    this.scrollContainer.style.setProperty("--scroll-width", width + "px");
    this.scrollContainer.style.setProperty("--scroll-height", height + "px");
    this.contents.style.setProperty("--translate-x", this.translateX + "px");
    this.contents.style.setProperty("--translate-y", this.translateY + "px");
  }

  private updateHeaders() {
    if (!this.tableHead || !this.tableBody) {
      return;
    }

    if (this.editable) {
      for (const th of this.tableHead.rows[0]!.cells) {
        if (th.ariaColIndex) {
          makeDraggable(th, {
            constrain: "horizontal",
            clone: true,
            signal: this.editAbortController?.signal,
          });
          th.appendChild(this.createResizeHandle());
        }
      }

      for (const row of this.tableBody.rows) {
        const th = row.querySelector("th");
        if (th) {
          makeDraggable(th, {
            constrain: "vertical",
            clone: true,
            signal: this.editAbortController?.signal,
          });
        }
      }
    } else {
      for (const handle of this.tableHead.querySelectorAll("resize-handle")) {
        handle.remove();
      }
    }
  }

  private createResizeHandle() {
    const handle = document.createElement("resize-handle");
    handle.addEventListener("resizeend", this, {
      signal: this.editAbortController?.signal,
    });
    return handle;
  }

  moveColumn(column: Column, afterIndex: number | null) {
    if (!this.colGroup || !this.tableBody) {
      throw new Error("Table is not initialized");
    }

    // Re-order column elements
    // Note: No need to re-order column header cells as they hold no data
    const index = this.visibleColumns.indexOf(column);
    const beforeCol =
      afterIndex === null
        ? null
        : this.colGroup.querySelector<HTMLTableColElement>(
            `col[data-index="${afterIndex + 1}"]`,
          );
    this.visibleColumns = moveElement(
      this.visibleColumns,
      index,
      afterIndex === null
        ? 0
        : afterIndex > index
          ? afterIndex
          : afterIndex + 1,
    );
    moveBefore(this.colGroup, column.element, beforeCol);
    const columns = this.colGroup.getElementsByTagName("col");
    // Skip first column
    for (let i = 1; i < columns.length; i++) {
      columns[i]!.dataset.index = (this.firstVisibleColumn + i - 1).toString();
    }

    // Re-order cells
    for (const row of this.tableBody.rows) {
      const cell = row.querySelector<HTMLTableCellElement>(
        `td[aria-colindex="${index}"]`,
      );
      if (!cell) {
        continue;
      }
      const beforeCell =
        afterIndex === null
          ? null
          : row.querySelector<HTMLTableCellElement>(
              `td[aria-colindex="${afterIndex + 1}"]`,
            );
      moveBefore(row, cell, beforeCell);
      // Skip row header
      for (let i = 1; i < row.cells.length; i++) {
        row.cells[i]!.ariaColIndex = (
          this.firstVisibleColumn +
          i -
          1
        ).toString();
      }
    }

    this.redrawSelection();
  }

  moveRow(row: Row, afterIndex: number | null) {
    if (!this.tableBody) {
      throw new Error("Table is not initialized");
    }
    const beforeRow =
      afterIndex === null
        ? null
        : this.tableBody.querySelector<HTMLTableRowElement>(
            `tr[aria-rowindex="${afterIndex + 1}"]`,
          );
    moveBefore(this.tableBody, row.element, beforeRow);

    for (let i = 0; i < this.tableBody.rows.length; i++) {
      this.tableBody.rows[i]!.ariaRowIndex = (
        this.firstVisibleRow + i
      ).toString();
    }

    this.redrawSelection();
  }

  deleteColumn(id: string) {
    const index = this.visibleColumns.findIndex((c) => c.id === id);
    if (index < 0) {
      throw new Error(`Invalid column ID: ${id}`);
    }

    const column = this.visibleColumns[index]!;
    column.element.remove();
    column.header?.remove();
    for (const cell of column.cells) {
      this.recycleCell(cell);
    }
    this.visibleColumns = this.visibleColumns.toSpliced(index, 1);
    this.redrawSelection();
  }

  deleteRow(id: string) {
    const index = this.visibleRows.findIndex((r) => r.id === id);
    if (index < 0) {
      throw new Error(`Invalid row ID: ${id}`);
    }

    const row = this.visibleRows[index]!;
    this.recycleRow(row.element);
    this.visibleRows = this.visibleRows.toSpliced(index, 1);
    this.redrawSelection();
  }
}

customElements.define("table-view", TableView);
