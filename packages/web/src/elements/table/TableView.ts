import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import css from "./TableView.css?inline";
import { TableEvent } from "./events";
import type { ResizeEvent } from "@/elements/resize/events";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const MAX_VISIBLE_ROWS = 50;

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

export type Selection = {
  anchor: Cell;
  focus: Cell;
};

function defaultGetColumnWidth() {
  return 160;
}

export default class TableView extends HTMLElement {
  static readonly observedAttributes: (keyof TableViewAttributes)[] = [
    "columns",
    "rows",
    "allowselection",
  ] as const;

  #columns = 1;
  #rows = 1;
  #allowSelection = false;

  selection: Selection | null = null;
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
    this.addEventListener("pointerup", this, { passive: true });
  }

  enableVirtualization(
    update: (row: number, column: number, element: Element) => void,
  ) {
    if (this.virtualize) {
      throw new Error("Virtualization is already enabled");
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
    this.createCells();
    this.fillCellBuffer();
    this.fillRowBuffer();

    this.updateCellTabIndex();
    this.updateColumnResizeHandles();

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
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  attributeChangedCallback(
    name: keyof TableViewAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "columns":
        if (value === null) {
          throw new RangeError("columns attribute is required");
        }
        this.#columns = parseInt(value, 10);
        this.update();
        this.updateColumnResizeHandles();
        break;
      case "rows":
        if (value === null) {
          throw new RangeError("rows attribute is required");
        }
        this.#rows = parseInt(value, 10);
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
      case "pointerup":
        return this.handlePointerUp(event as PointerEvent);
      case "pointerover":
        return this.handlePointerOver(event as PointerEvent);
      case "resizeend":
        return this.handleResizeEnd(event as ResizeEvent);
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
      this.selection.focus = { row, column };
      this.redrawSelection();
    }
  }

  private handleResizeEnd(event: ResizeEvent) {
    const target = event.currentTarget as HTMLElement;
    const column = parseInt(target.closest("th")?.ariaColIndex ?? "", 10);
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
    }

    this.update();
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

  private clearSelection() {
    this.querySelectorAll(".selected").forEach((cell) =>
      cell.classList.remove("selected"),
    );
    this.selection = null;
    this.isSelecting = false;
  }

  private redrawSelection() {
    this.querySelectorAll(".selected").forEach((cell) =>
      cell.classList.remove("selected"),
    );

    if (!this.selection) {
      return;
    }

    const startRow = Math.min(
      this.selection.anchor.row,
      this.selection.focus.row,
    );
    const endRow = Math.max(
      this.selection.anchor.row,
      this.selection.focus.row,
    );
    const startColumn = Math.min(
      this.selection.anchor.column,
      this.selection.focus.column,
    );
    const endColumn = Math.max(
      this.selection.anchor.column,
      this.selection.focus.column,
    );

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

  // Column sizing

  private getColumnSpan(start: number, columns: number) {
    let width = 0;
    for (let i = 0; i < columns; i++) {
      width += this.getColumnWidth(start + i);
    }
    return width;
  }

  private getVisibleColumns(availableWidth: number, start: number) {
    let width = 0;
    let columns = 0;
    while (width < availableWidth && start + columns < this.#columns) {
      width += this.getColumnWidth(start + columns);
      columns++;
    }
    return columns;
  }

  // Virtualization

  private createCells() {
    if (!this.tableBody) {
      return;
    }

    const rect = this.getBoundingClientRect();
    let rowIndex = this.childElementCount;

    this.renderedColumns = this.getVisibleColumns(
      rect.width + this.horizontalBufferSize * 2,
      0,
    );

    while (
      rowIndex < this.#rows &&
      this.contents.offsetHeight < rect.height + this.verticalBufferSize * 2
    ) {
      const row = this.createRow();
      row.ariaRowIndex = rowIndex.toString();

      for (let i = 0; i < this.renderedColumns; i++) {
        const cell = this.createCell();
        this.updateCell?.(rowIndex, i, cell);
        cell.ariaColIndex = i.toString();
        row.appendChild(cell);
      }
      this.tableBody.appendChild(row);

      rowIndex++;

      if (rowIndex > MAX_VISIBLE_ROWS) {
        break;
      }
    }

    this.firstVisibleRow = 0;
    this.firstVisibleColumn = 0;
    this.renderedRows = rowIndex;
    this.contentWidth = this.contents.offsetWidth;
    this.contentHeight = this.contents.offsetHeight;
    this.reposition();
  }

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

  private insertColumn(position: number, columnIndex: number) {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const col = document.createElement("col");
    col.dataset.index = columnIndex.toString();
    col.style.width = this.getColumnWidth(columnIndex) + "px";
    this.colGroup.insertBefore(
      col,
      this.colGroup.children[position + 1] ?? null,
    );

    const th = document.createElement("th");
    th.ariaColIndex = columnIndex.toString();
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

  private fillLeft(width: number) {
    const startWidth = this.contentWidth;
    const targetWidth = startWidth + width;

    while (
      this.firstVisibleColumn > 0 &&
      this.contents.offsetWidth < targetWidth
    ) {
      this.insertColumn(0, this.firstVisibleColumn - 1);
      this.firstVisibleColumn--;
    }

    const newWidth = this.contents.offsetWidth;
    const delta = newWidth - startWidth;
    this.contentWidth = newWidth;
    this.translateX -= delta;
    this.reposition();
  }

  private fillRight(width: number) {
    const startWidth = this.contentWidth;
    const targetWidth = startWidth + width;

    while (
      this.firstVisibleColumn + this.renderedColumns < this.#columns &&
      this.contents.offsetWidth < targetWidth
    ) {
      this.insertColumn(
        this.renderedColumns,
        this.firstVisibleColumn + this.renderedColumns,
      );
    }

    this.contentWidth = this.contents.offsetWidth;
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

  private drainLeft(width: number) {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const startWidth = this.contentWidth;
    const targetWidth = startWidth - width;
    let removedColumns = 0;

    while (
      removedColumns < this.renderedColumns &&
      this.contents.offsetWidth > targetWidth
    ) {
      this.colGroup.children[1]?.remove();
      this.tableHead.rows[0]?.cells[1]?.remove();

      for (const row of rows) {
        const cell = row.cells[1];
        if (cell) {
          this.recycleCell(cell);
        }
      }

      removedColumns++;
    }

    if (removedColumns > 0) {
      const endWidth = this.contents.offsetWidth;
      this.firstVisibleColumn += removedColumns;
      this.renderedColumns -= removedColumns;
      this.contentWidth = endWidth;
      const delta = startWidth - endWidth;
      this.translateX += delta;
      this.reposition();
    }
  }

  private drainRight(width: number) {
    if (!this.colGroup || !this.tableHead || !this.tableBody) {
      return;
    }

    const rows = this.tableBody.rows;
    const startWidth = this.contentWidth;
    const targetWidth = startWidth - width;
    let removedColumns = 0;

    while (
      removedColumns < this.renderedColumns &&
      this.contents.offsetWidth > targetWidth
    ) {
      this.colGroup.lastElementChild?.remove();
      this.tableHead.rows[0]?.lastElementChild?.remove();

      for (const row of rows) {
        const cell = row.cells[row.cells.length - 1];
        if (cell) {
          this.recycleCell(cell);
        }
      }
      removedColumns++;
    }

    this.renderedColumns -= removedColumns;
    this.contentWidth = this.contents.offsetWidth;
  }

  private update() {
    const topOffset = this.translateY - this.scrollTop;
    const leftOffset = this.translateX - this.scrollLeft;
    const topBuffer = -topOffset;
    const leftBuffer = -leftOffset;
    const bottom = topOffset + this.contentHeight;
    const bottomBuffer = bottom - this.height;
    const right = leftOffset + this.contentWidth;
    const rightBuffer = right - this.width;

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

    if (leftBuffer > this.horizontalBufferSize * 3) {
      this.drainLeft(leftBuffer - this.horizontalBufferSize * 2);
    } else if (
      leftBuffer < this.horizontalBufferSize &&
      this.firstVisibleColumn > 0
    ) {
      this.fillLeft(this.horizontalBufferSize * 2 - leftBuffer);
    }

    if (rightBuffer > this.horizontalBufferSize * 3) {
      this.drainRight(rightBuffer - this.horizontalBufferSize * 2);
    } else if (
      rightBuffer < this.horizontalBufferSize &&
      this.firstVisibleColumn + this.renderedColumns < this.#columns
    ) {
      this.fillRight(this.horizontalBufferSize * 2 - rightBuffer);
    }
  }

  private reposition() {
    if (!this.scrollContainer) {
      return;
    }

    const width = this.getColumnSpan(0, this.#columns);
    const averageRowHeight = this.contentHeight / this.renderedRows;
    const height = this.#rows * averageRowHeight;
    this.translateX = this.getColumnSpan(0, this.firstVisibleColumn);
    this.translateY = this.firstVisibleRow * averageRowHeight;

    this.scrollContainer.style.setProperty("--scroll-width", width + "px");
    this.scrollContainer.style.setProperty("--scroll-height", height + "px");
    this.contents.style.setProperty("--translate-x", this.translateX + "px");
    this.contents.style.setProperty("--translate-y", this.translateY + "px");
  }

  private updateColumnResizeHandles() {
    const headers = this.tableHead?.rows[0]?.cells;

    if (!headers) {
      return;
    }

    for (const th of headers) {
      if (th.ariaColIndex) {
        const handle = th.querySelector("resize-handle");
        if (!handle) {
          th.appendChild(this.createResizeHandle());
        }
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
