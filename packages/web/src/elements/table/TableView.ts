import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import css from "./TableView.css?inline";
import { TableEvent } from "./events";
import { makeDraggable } from "@/utils/drag";
import type { ResizeEvent } from "@/elements/resize/events";
import type { DragDropEvent } from "@/utils/drag";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface TableViewAttributes {
  columns: number;
  rows: number;
  allowselection?: boolean;
}

export interface Cell {
  row: number;
  column: number;
}

export interface VisibleCell extends Cell {
  element: HTMLElement;
}

export type RangeSelection = {
  anchor: Cell;
  focus: Cell;
};

export type ColumnSelection = {
  column: number;
};

export type RowSelection = {
  row: number;
};

export type Selection = RangeSelection | ColumnSelection | RowSelection;

function defaultGetColumnWidth() {
  return 160;
}

export default class TableView extends HTMLElement {
  static readonly observedAttributes: (keyof TableViewAttributes)[] = [
    "columns",
    "rows",
    "allowselection",
  ] as const;

  #columns = 0;
  #rows = 0;
  #allowSelection = false;

  readonly selection = new Set<Selection>();
  getColumnWidth: (index: number) => number = defaultGetColumnWidth;

  private scrollContainer?: HTMLElement;
  private contents: HTMLElement;
  private contentsSlot: HTMLSlotElement;
  private table: HTMLTableElement | null = null;
  private colGroup: HTMLTableColElement | null = null;
  private tableHead: HTMLTableSectionElement | null = null;
  private tableBody: HTMLTableSectionElement | null = null;
  private firstVisibleRow = 0;
  private firstVisibleColumn = 0;
  private renderedRows = 0;
  private renderedColumns = 0;
  private resizeObserver?: ResizeObserver;
  private translateX = 0;
  private translateY = 0;
  private width = 0;
  private height = 0;
  private contentWidth = 0;
  private contentHeight = 0;
  private buffer: HTMLElement[] = [];
  private rowBuffer: HTMLElement[] = [];
  private columnWidths: number[] = [];
  private horizontalBufferSize = 0;
  private verticalBufferSize = 0;
  private isSelecting = false;
  private virtualize = false;
  private updateCell?: (row: number, column: number, element: Element) => void;

  get columns() {
    return this.#columns;
  }

  set columns(value: number) {
    if (value !== this.#columns) {
      this.#columns = value;
      this.update();
    }
  }

  get allowSelection() {
    return this.#allowSelection;
  }

  set allowSelection(value: boolean) {
    if (value === this.#allowSelection) {
      return;
    }

    this.#allowSelection = value;

    this.updateCellTabIndex();

    if (!value) {
      this.clearSelection();
    }
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
    this.addEventListener("dnd-dragenter", this);
    this.addEventListener("dnd-drop", this);
  }

  enableVirtualization(
    update: (row: number, column: number, element: Element) => void,
  ) {
    if (this.virtualize) {
      throw new Error("Virtualization is already enabled");
    }

    if (!this.tableBody || !this.colGroup) {
      return;
    }

    this.virtualize = true;
    this.updateCell = update;

    this.scrollContainer = document.createElement("div");
    this.scrollContainer.id = "scroll-container";
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

    this.renderedColumns = this.colGroup.childElementCount - 1;
    this.renderedRows = this.tableBody.rows.length;

    for (const column of this.colGroup.children) {
      if (column === this.colGroup.firstElementChild) {
        continue;
      }
      const rect = column.getBoundingClientRect();
      this.columnWidths.push(rect.width);
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
      col.style.width = "32px";
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

    this.dataset.drop = "true";
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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
      case "allowselection":
        this.allowSelection = value !== null;
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
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent);
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent);
    }
  }

  private handleScroll() {
    const scrollTop = this.scrollTop;
    this.update();
    this.scrollTop = scrollTop;
  }

  private handleKeyDown(event: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (
      event.key === "Escape" &&
      activeElement instanceof HTMLElement &&
      this.contains(activeElement)
    ) {
      event.preventDefault();
      activeElement.blur();
      this.closest<HTMLElement>("[tabindex]")?.focus({ preventScroll: true });
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    const { target } = event;

    if (
      target instanceof HTMLTableCellElement &&
      target.tagName === "TH" &&
      target.scope === "col" &&
      target.ariaColIndex
    ) {
      event.preventDefault();
      const selection = { column: parseInt(target.ariaColIndex, 10) };
      if (event.shiftKey) {
        this.addSelection(selection);
      } else {
        this.setSelection(selection);
      }
      return;
    }

    if (
      target instanceof HTMLTableCellElement &&
      target.tagName === "TH" &&
      target.scope === "row" &&
      target.parentElement?.ariaRowIndex
    ) {
      event.preventDefault();
      const selection = {
        row: parseInt(target.parentElement.ariaRowIndex, 10),
      };
      if (event.shiftKey) {
        this.addSelection(selection);
      } else {
        this.setSelection(selection);
      }
      return;
    }

    this.clearSelection();
  }

  private handlePointerUp(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    this.isSelecting = false;
  }

  private handlePointerOver(event: PointerEvent) {
    if (!this.allowSelection) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (this.isSelecting && this.selection) {
      const row = parseInt(target.parentElement!.ariaRowIndex ?? "0", 10);
      const column = parseInt(target.ariaColIndex ?? "0", 10);
      // this.selection.focus = { row, column };
      this.redrawSelection();
    }
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

    const column = parseInt(th?.ariaColIndex ?? "", 10);
    if (Number.isNaN(column)) {
      return;
    }

    const col = this.querySelector<HTMLTableColElement>(
      `col[data-index="${column}"]`,
    );
    if (!col) {
      return;
    }

    const width = parseFloat(col.style.width) + event.x;
    this.dispatchEvent(new TableEvent("resizetablecolumn", { column, width }));

    if (col) {
      col.style.width = width + "px";
      const position = Array.from(this.colGroup.children).indexOf(col) - 1;
      this.columnWidths[position] = width;
    }

    this.update();
  }

  private handleDragEnter(event: DragDropEvent) {
    const element = event.state.element;

    if (element.tagName !== "TH" || !this.contains(element)) {
      event.preventDefault();
    }
  }

  private handleDrop(event: DragDropEvent) {
    const element = event.state.element;

    if (
      !this.colGroup ||
      element.tagName !== "TH" ||
      !element.ariaColIndex ||
      !this.contains(element)
    ) {
      return;
    }

    const column = parseInt(element.ariaColIndex, 10);

    let newIndex = 0;
    for (const col of this.colGroup.children as Iterable<HTMLTableColElement>) {
      if (!col.dataset.index) {
        continue;
      }

      if (col.getBoundingClientRect().left > event.clientX) {
        break;
      }

      newIndex = parseInt(col.dataset.index, 10);
    }

    this.dispatchEvent(
      new TableEvent("reordertablecolumn", {
        column,
        newIndex,
      }),
    );
  }

  // Focus and selection

  private updateCellTabIndex() {
    if (this.allowSelection) {
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
    this.redrawSelection();
  }

  private addSelection(selection: Selection) {
    this.selection.add(selection);
    this.redrawSelection();
  }

  private clearSelection() {
    this.querySelectorAll(".selected").forEach((cell) =>
      cell.classList.remove("selected"),
    );
    this.selection.clear();
    this.isSelecting = false;
  }

  private redrawSelection() {
    this.querySelectorAll(".selected").forEach((element) =>
      element.classList.remove("selected"),
    );

    for (const selection of this.selection) {
      if ("anchor" in selection) {
        this.drawRangeSelection(selection);
      } else if ("column" in selection) {
        this.drawColumnSelection(selection);
      } else if ("row" in selection) {
        this.drawRowSelection(selection);
      }
    }
  }

  private drawRangeSelection(selection: RangeSelection) {
    const startRow = Math.min(selection.anchor.row, selection.focus.row);
    const endRow = Math.max(selection.anchor.row, selection.focus.row);
    const startColumn = Math.min(
      selection.anchor.column,
      selection.focus.column,
    );
    const endColumn = Math.max(selection.anchor.column, selection.focus.column);

    const startVisibleRow = Math.max(startRow, this.firstVisibleRow);
    const endVisibleRow = Math.min(
      endRow,
      this.firstVisibleRow + this.renderedRows,
    );
    const startVisibleColumn = Math.max(startColumn, this.firstVisibleColumn);
    const endVisibleColumn = Math.min(
      endColumn,
      this.firstVisibleColumn + this.renderedColumns,
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
    const { column } = selection;
    this.querySelector(`col[data-index="${column}"]`)?.classList.add(
      "selected",
    );
    this.querySelector(`th[aria-colindex="${column}"]`)?.classList.add(
      "selected",
    );
  }

  private drawRowSelection(selection: RowSelection) {
    const { row } = selection;
    this.querySelector(`tr[aria-rowindex="${row}"]`)?.classList.add("selected");
    this.querySelector(`tr[aria-rowindex="${row}"] > th`)?.classList.add(
      "selected",
    );
  }

  // Column sizing

  private getColumnSpan(start: number, columns: number) {
    let width = 0;
    for (let i = 0; i < columns; i++) {
      width += this.getColumnWidth(start + i);
    }
    return width;
  }

  // Virtualization

  private fillRowBuffer() {
    const bufferSize = this.renderedRows;
    for (let i = this.rowBuffer.length; i < bufferSize; i++) {
      this.rowBuffer.push(this.createRow());
    }
  }

  private fillCellBuffer() {
    const bufferSize = this.renderedColumns * 10;
    for (let i = this.buffer.length; i < bufferSize; i++) {
      this.buffer.push(this.createCell());
    }
  }

  private createRow() {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    makeDraggable(th, { constrain: "vertical" });
    tr.appendChild(th);
    return tr;
  }

  private createCell() {
    const cell = document.createElement("td");
    cell.addEventListener("pointerover", this, { passive: true });
    return cell;
  }

  private getCell(row: number, column: number) {
    if (this.buffer.length === 0) {
      this.fillCellBuffer();
    }

    const cell = this.buffer.pop()!;
    cell.ariaColIndex = column.toString();
    if (this.allowSelection) {
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

  private getRow() {
    if (this.rowBuffer.length === 0) {
      this.fillRowBuffer();
    }
    return this.rowBuffer.pop()!;
  }

  private insertColumn(position: number, columnIndex: number, width: number) {
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
    makeDraggable(th, { constrain: "horizontal" });
    const headerRow = this.tableHead.rows[0]!;
    headerRow.insertBefore(th, headerRow.children[position + 1] ?? null);

    const rows = this.tableBody.rows;

    for (let i = 0; i < this.renderedRows; i++) {
      const row = rows[i]!;
      const cell = this.getCell(this.firstVisibleRow + i, columnIndex);
      row.insertBefore(cell, row.children[position + 1] ?? null);
    }

    this.renderedColumns++;
  }

  private insertRow(position: number, rowIndex: number) {
    if (!this.tableBody) {
      return;
    }

    const cells = [];
    for (let i = 0; i < this.renderedColumns; i++) {
      const cell = this.getCell(rowIndex, this.firstVisibleColumn + i);
      cells.push(cell);
    }

    const row = this.getRow();
    row.ariaRowIndex = rowIndex.toString();
    row.append(...cells);
    this.tableBody.insertBefore(row, this.tableBody.children[position] ?? null);

    this.renderedRows++;
  }

  private fillTop(height: number) {
    const startHeight = this.contentHeight;
    const targetHeight = startHeight + height;

    while (
      this.firstVisibleRow > 0 &&
      this.contents.offsetHeight < targetHeight
    ) {
      this.insertRow(0, this.firstVisibleRow - 1);
      this.firstVisibleRow--;
    }

    const newHeight = this.contents.offsetHeight;
    const delta = newHeight - startHeight;
    this.contentHeight = newHeight;
    this.translateY -= delta;
    this.reposition();
  }

  private fillBottom(height: number) {
    const startHeight = this.contentHeight;
    const targetHeight = startHeight + height;

    while (
      this.firstVisibleRow + this.renderedRows < this.#rows &&
      this.contents.offsetHeight < targetHeight
    ) {
      this.insertRow(
        this.renderedRows,
        this.firstVisibleRow + this.renderedRows,
      );
    }

    this.contentHeight = this.contents.offsetHeight;
  }

  private fillLeft() {
    while (
      this.firstVisibleColumn > 0 &&
      this.scrollLeft - this.translateX < this.horizontalBufferSize
    ) {
      const index = this.firstVisibleColumn - 1;
      const width = this.getColumnWidth(index);
      this.columnWidths.unshift(width);
      this.insertColumn(0, index, width);
      this.firstVisibleColumn--;
      this.translateX -= width;
      this.contentWidth += width;
    }

    this.reposition();
  }

  private fillRight() {
    while (
      this.firstVisibleColumn + this.renderedColumns < this.#columns &&
      this.translateX - this.scrollLeft + this.contentWidth - this.width <
        this.horizontalBufferSize
    ) {
      const index = this.firstVisibleColumn + this.renderedColumns;
      const width = this.getColumnWidth(index);
      this.columnWidths.push(width);
      this.insertColumn(
        this.renderedColumns,
        this.firstVisibleColumn + this.renderedColumns,
        width,
      );
      this.contentWidth += width;
    }
  }

  private drainTop(height: number) {
    if (!this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const startHeight = this.contentHeight;
    const targetHeight = startHeight - height;
    let removedRows = 0;

    while (
      removedRows < this.renderedRows &&
      this.contents.offsetHeight > targetHeight
    ) {
      const row = rows[0];
      if (!row) {
        break;
      }

      row.remove();
      this.rowBuffer.push(row);

      for (const cell of row.cells) {
        if (cell.tagName === "TD") {
          this.recycleCell(cell);
        }
      }

      removedRows++;
    }

    if (removedRows > 0) {
      const endHeight = this.contents.offsetHeight;
      this.firstVisibleRow += removedRows;
      this.renderedRows -= removedRows;
      this.contentHeight = endHeight;
      const delta = startHeight - endHeight;
      this.translateY += delta;
      this.reposition();
    }
  }

  private drainBottom(height: number) {
    if (!this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const startHeight = this.contentHeight;
    const targetHeight = startHeight - height;
    let removedRows = 0;

    while (
      removedRows < this.renderedRows &&
      this.contents.offsetHeight > targetHeight
    ) {
      const row = rows[rows.length - 1];
      if (!row) {
        break;
      }

      row.remove();
      this.rowBuffer.push(row);

      for (const cell of row.cells) {
        if (cell.tagName === "TD") {
          this.recycleCell(cell);
        }
      }

      removedRows++;
    }

    this.renderedRows -= removedRows;
    this.contentHeight = this.contents.offsetHeight;
  }

  private drainLeft() {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    let width = this.columnWidths[0];

    while (
      width &&
      this.translateX - this.scrollLeft + width < -this.horizontalBufferSize
    ) {
      this.colGroup.children[1]?.remove();
      this.tableHead.rows[0]?.cells[1]?.remove();

      for (const row of rows) {
        const cell = row.cells[1];
        if (cell) {
          this.recycleCell(cell);
        }
      }

      this.columnWidths.shift();
      this.firstVisibleColumn++;
      this.renderedColumns--;
      this.contentWidth -= width;
      this.translateX += width;

      width = this.columnWidths[0];
    }

    this.reposition();
  }

  private drainRight() {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const right = this.scrollLeft - this.translateX + this.width;

    while (
      this.renderedColumns > 1 &&
      this.contentWidth - right > this.horizontalBufferSize * 3
    ) {
      const width = this.columnWidths.at(-1) ?? 0;
      this.colGroup.lastElementChild?.remove();
      this.tableHead.rows[0]?.lastElementChild?.remove();

      for (const row of rows) {
        const cell = row.cells[row.cells.length - 1];
        if (cell) {
          this.recycleCell(cell);
        }
      }

      this.columnWidths.pop();
      this.renderedColumns--;
      this.contentWidth -= width;
    }
  }

  private update() {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const topOffset = this.translateY - this.scrollTop;
    const topBuffer = -topOffset;
    const bottom = topOffset + this.contentHeight;
    const bottomBuffer = bottom - this.height;

    if (topBuffer > this.verticalBufferSize * 3) {
      this.drainTop(topBuffer - this.verticalBufferSize * 2);
    } else if (
      topBuffer < this.verticalBufferSize &&
      this.firstVisibleRow > 0
    ) {
      this.fillTop(this.verticalBufferSize * 2 - topBuffer);
    }

    if (bottomBuffer > this.verticalBufferSize * 3) {
      this.drainBottom(bottomBuffer - this.verticalBufferSize * 2);
    } else if (
      bottomBuffer < this.verticalBufferSize &&
      this.firstVisibleRow + this.renderedRows < this.#rows
    ) {
      this.fillBottom(this.verticalBufferSize * 2 - bottomBuffer);
    }

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
    const averageRowHeight = this.contentHeight / this.renderedRows;
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

    for (const th of this.tableHead.rows[0]!.cells) {
      if (th.ariaColIndex) {
        makeDraggable(th, { constrain: "horizontal" });
        th.appendChild(this.createResizeHandle());
      }
    }

    for (const row of this.tableBody.rows) {
      const th = row.querySelector("th");
      if (th) {
        makeDraggable(th, { constrain: "vertical" });
      }
    }
  }

  private createResizeHandle() {
    const handle = document.createElement("resize-handle");
    handle.addEventListener("resizeend", this);
    return handle;
  }
}

customElements.define("table-view", TableView);
