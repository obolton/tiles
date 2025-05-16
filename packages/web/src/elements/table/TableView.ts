import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import css from "./TableView.css?inline";

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

export default class TableView extends HTMLElement {
  static readonly observedAttributes: (keyof TableViewAttributes)[] = [
    "columns",
    "rows",
    "allowselection",
  ] as const;

  #columns = 1;
  #rows = 1;
  #allowSelection = false;

  columnWidths: number[] = [];
  selection: Selection | null = null;

  private scrollContainer?: HTMLElement;
  private contents: HTMLElement;
  private contentsSlot: HTMLSlotElement;
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
    this.#allowSelection = value;

    if (value) {
      this.querySelectorAll('div[role="cell"]').forEach((cell) =>
        cell.setAttribute("tabindex", "-1"),
      );
    } else {
      this.clearSelection();
      this.querySelectorAll('div[role="cell"][tabindex]').forEach((cell) =>
        cell.removeAttribute("tabindex"),
      );
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
    this.horizontalBufferSize = this.width / 2;
    this.verticalBufferSize = this.height / 2;
    this.createCells();
    this.fillCellBuffer();
    this.fillRowBuffer();

    this.addEventListener("scroll", this, { passive: true });

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );
    this.resizeObserver.observe(this, { box: "border-box" });
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
        break;
      case "rows":
        if (value === null) {
          throw new RangeError("rows attribute is required");
        }
        this.#rows = parseInt(value, 10);
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
      const row = parseInt(target.dataset.row ?? "0", 10);
      const column = parseInt(target.dataset.column ?? "0", 10);
      this.selection.focus = { row, column };
      this.redrawSelection();
    }
  }

  // Focus and selection

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
          `[data-row="${row}"][data-column="${column}"]`,
        )?.classList.add("selected");
      }
    }
  }

  // Column sizing

  private getColumnWidth(column: number) {
    return this.columnWidths[column] ?? 160;
  }

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

      for (let i = 0; i < this.renderedColumns; i++) {
        const cell = this.createCell();
        this.updateCell?.(rowIndex, i, cell);
        cell.style.width = `${this.getColumnWidth(i)}px`;
        cell.dataset.row = rowIndex.toString();
        cell.dataset.column = i.toString();
        row.append(cell);
      }
      this.appendChild(row);

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
    const row = document.createElement("div");
    row.role = "row";
    return row;
  }

  private createCell() {
    const cell = document.createElement("div");
    cell.role = "cell";
    cell.addEventListener("pointerover", this, { passive: true });
    return cell;
  }

  private getCell(row: number, column: number) {
    if (this.buffer.length === 0) {
      this.fillCellBuffer();
    }

    const cell = this.buffer.pop()!;
    cell.style.width = this.getColumnWidth(column) + "px";
    cell.dataset.row = row.toString();
    cell.dataset.column = column.toString();
    if (this.allowSelection) {
      cell.setAttribute("tabindex", "-1");
    }
    this.updateCell?.(row, column, cell);

    return cell;
  }

  private recycleCell(cell: HTMLElement) {
    cell.remove();
    cell.replaceChildren();
    cell.classList.remove("selected");
    cell.removeAttribute("tabindex");
    delete cell.dataset.row;
    delete cell.dataset.column;
    this.buffer.push(cell);
  }

  private getRow() {
    if (this.rowBuffer.length === 0) {
      this.fillRowBuffer();
    }
    return this.rowBuffer.pop()!;
  }

  private prependColumn() {
    for (let i = 0; i < this.renderedRows; i++) {
      const row = this.contents.children[i] as HTMLElement;
      const cell = this.getCell(
        this.firstVisibleRow + i,
        this.firstVisibleColumn - 1,
      );
      row.prepend(cell);
    }

    this.firstVisibleColumn--;
    this.renderedColumns++;
  }

  private appendColumn() {
    const column = this.firstVisibleColumn + this.renderedColumns;

    for (let i = 0; i < this.renderedRows; i++) {
      const row = this.children[i] as HTMLElement;
      const cell = this.getCell(this.firstVisibleRow + i, column);
      row.appendChild(cell);
    }

    this.renderedColumns++;
  }

  private prependRow() {
    const row = this.getRow();

    const elements = [];
    for (let i = 0; i < this.renderedColumns; i++) {
      const cell = this.getCell(
        this.firstVisibleRow - 1,
        this.firstVisibleColumn + i,
      );
      elements.push(cell);
    }
    row.replaceChildren(...elements);
    this.prepend(row);

    this.firstVisibleRow--;
    this.renderedRows++;
  }

  private appendRow() {
    const rowIndex = this.firstVisibleRow + this.renderedRows;

    const elements = [];
    for (let i = 0; i < this.renderedColumns; i++) {
      const cell = this.getCell(rowIndex, this.firstVisibleColumn + i);
      elements.push(cell);
    }
    const row = this.getRow();
    row.replaceChildren(...elements);
    this.append(row);

    this.renderedRows++;
  }

  private fillTop(height: number) {
    const startHeight = this.contentHeight;
    const targetHeight = startHeight + height;

    while (
      this.firstVisibleRow > 0 &&
      this.contents.offsetHeight < targetHeight
    ) {
      this.prependRow();
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
      this.appendRow();
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
      this.prependColumn();
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
      this.appendColumn();
    }

    this.contentWidth = this.contents.offsetWidth;
  }

  private drainTop(height: number) {
    const startHeight = this.contentHeight;
    const targetHeight = startHeight - height;
    let rows = 0;
    while (
      rows < this.renderedRows &&
      this.contents.offsetHeight > targetHeight
    ) {
      const row = this.firstElementChild as HTMLElement | undefined;
      if (row) {
        row.remove();
        this.rowBuffer.push(row);
        for (const child of row.children) {
          this.recycleCell(child as HTMLElement);
        }
      }
      rows++;
    }

    if (rows > 0) {
      const endHeight = this.contents.offsetHeight;
      this.firstVisibleRow += rows;
      this.renderedRows -= rows;
      this.contentHeight = endHeight;
      const delta = startHeight - endHeight;
      this.translateY += delta;
      this.reposition();
    }
  }

  private drainBottom(height: number) {
    const startHeight = this.contentHeight;
    const targetHeight = startHeight - height;
    let removedRows = 0;
    while (
      removedRows < this.renderedRows &&
      this.contents.offsetHeight > targetHeight
    ) {
      const row = this.lastElementChild as HTMLElement | undefined;
      if (!row) {
        break;
      }

      row.remove();
      this.rowBuffer.push(row);

      for (const cell of row.children) {
        cell.remove();
        this.buffer.push(cell as HTMLElement);
      }

      removedRows++;
    }

    this.renderedRows -= removedRows;
    this.contentHeight = this.contents.offsetHeight;
  }

  private drainLeft(width: number) {
    const startWidth = this.contentWidth;
    const targetWidth = startWidth - width;
    let columns = 0;
    while (
      columns < this.renderedColumns &&
      this.contents.offsetWidth > targetWidth
    ) {
      for (let i = 0; i < this.renderedRows; i++) {
        const row = this.children[i]!;
        const cell = row.firstElementChild as HTMLElement | undefined;
        if (cell) {
          cell.remove();
          this.buffer.push(cell);
        }
      }

      columns++;
    }

    if (columns > 0) {
      const endWidth = this.contents.offsetWidth;
      this.firstVisibleColumn += columns;
      this.renderedColumns -= columns;
      this.contentWidth = endWidth;
      const delta = startWidth - endWidth;
      this.translateX += delta;
      this.reposition();
    }
  }

  private drainRight(width: number) {
    const startWidth = this.contentWidth;
    const targetWidth = startWidth - width;
    let removedColumns = 0;

    while (
      removedColumns < this.renderedColumns &&
      this.contents.offsetWidth > targetWidth
    ) {
      for (const row of this.children) {
        const cell = row.lastElementChild as HTMLElement | undefined;
        if (cell) {
          cell.remove();
          this.buffer.push(cell);
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
}

customElements.define("table-view", TableView);
