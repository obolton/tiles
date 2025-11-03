import Column from "./Column";
import Row from "./Row";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { TableEvent } from "./events";
import { makeDraggable } from "@/utils/drag";
import { moveBefore } from "@/utils/dom";
import { moveElement } from "@/utils/arrays";
import { getFocusedDescendant } from "@/utils/focus";
import css from "./TableView.css?inline";
import newIcon from "@/icons/new.svg?raw";
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
  type: "range";
  anchor: Cell;
  focus: Cell;
};

export type ColumnSelection = {
  type: "column";
  column: Column;
};

export type RowSelection = {
  type: "row";
  row: Row;
};

export type Selection = RangeSelection | ColumnSelection | RowSelection;

function defaultGetColumn() {
  return { width: 160 };
}

function defaultGetRow() {
  return { height: 32 };
}

function isCellEqual(a: Cell, b: Cell) {
  return a.row.index === b.row.index && a.column.index === b.column.index;
}

const HEADER_SIZE = 32;
const ROW_BUFFER_MIN_SIZE = 3;
const CELL_BUFFER_MIN_SIZE = 10;

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
  getColumn: (index: number) => {
    id?: string;
    title?: string | null;
    width: number;
  } = defaultGetColumn;
  getRow: (index: number) => { id?: string; height: number } = defaultGetRow;
  updateCell?: (row: Row, column: Column, cell: HTMLTableCellElement) => void;

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
  private footerHeight = 0;
  private buffer: HTMLTableCellElement[] = [];
  private rowBuffer: HTMLTableRowElement[] = [];
  private visibleColumns: Column[] = [];
  private visibleRows: Row[] = [];
  private horizontalBufferSize = 0;
  private verticalBufferSize = 0;
  private isDraggingRange = false;
  private rangeSelection: RangeSelection | null = null;
  private editingCell: HTMLTableCellElement | null = null;
  private editingColumn: Column | null = null;
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

  get rows() {
    return this.#rows;
  }

  set rows(value: number) {
    if (value !== this.#rows) {
      this.#rows = value;
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
    this.updateFooter();

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

  get footer() {
    return this.table?.tFoot ?? null;
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
    this.addEventListener("focusin", this);
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
    this.updateFooter();

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
        this.columns = value === null ? 0 : parseInt(value, 10);
        break;
      case "rows":
        this.rows = value === null ? 0 : parseInt(value, 10);
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

    this.update();
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
      case "focusin":
        return this.handleFocusIn(event as FocusEvent);
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
        if (!(this.editingCell && event.shiftKey)) {
          event.preventDefault();

          if (event.altKey) {
            this.focusRowStart(event.metaKey);
          } else {
            this.focusCellBefore(event.metaKey);
          }
        }
        break;

      case "ArrowRight":
        if (!(this.editingCell && event.shiftKey)) {
          event.preventDefault();

          if (event.altKey) {
            this.focusRowEnd(event.metaKey);
          } else {
            this.focusCellAfter(event.metaKey);
          }
        }
        break;

      case "ArrowUp":
        if (!(this.editingCell && event.shiftKey)) {
          event.preventDefault();

          if (event.altKey) {
            this.focusColumnStart(event.metaKey);
          } else {
            this.focusCellAbove(event.metaKey);
          }
        }
        break;

      case "Enter":
      case "ArrowDown":
        if (!(this.editingCell && event.shiftKey)) {
          event.preventDefault();

          if (event.altKey) {
            this.focusColumnEnd(event.metaKey);
          } else {
            this.focusCellBelow(event.metaKey);
          }
        }
        break;

      case "Delete":
      case "Backspace":
        if (!this.editingCell) {
          event.preventDefault();
          this.dispatchEvent(
            new TableEvent("cleartableselection", {
              bubbles: true,
              cancelable: true,
            }),
          );
        }
        break;
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (
      event.button !== PRIMARY_MOUSE_BUTTON ||
      !this.editable ||
      event.defaultPrevented
    ) {
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
        const selection: ColumnSelection = { type: "column", column };
        if (event.shiftKey) {
          this.addSelection(selection);
        } else {
          this.setSelection(selection);

          if (this.editingColumn !== column) {
            this.endEditingColumn();
            column.header?.classList.add("edit");
            const allowEdit = column.element.dispatchEvent(
              new TableEvent("edittablecolumnstart", {
                column,
                bubbles: true,
                cancelable: true,
              }),
            );
            if (allowEdit) {
              event.preventDefault();
              this.editingColumn = column;
            }
          }
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
        type: "row",
        row: new Row({ table: this, id: element.dataset.id, element }),
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
        type: "range",
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
    if (
      !this.isDraggingRange ||
      !this.rangeSelection ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const cell = event.target.closest("td");
    if (cell) {
      this.moveSelectionFocus(this.getCellInfo(cell), true);
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
          type: "row",
          row: this.getRowAtIndex(index + 1),
        });
      }

      return;
    }
  }

  // Focus

  private handleFocusIn(event: FocusEvent) {
    const { target } = event;
    if (
      this.editable &&
      target instanceof HTMLTableCellElement &&
      target.tagName === "TD" &&
      target !== this.editingCell
    ) {
      this.endEditingCell();

      const allowEdit = target.dispatchEvent(
        new TableEvent("edittablecellstart", {
          ...this.getCellInfo(target),
          bubbles: true,
          cancelable: true,
        }),
      );

      if (allowEdit) {
        this.editingCell = target;
      }
    }
  }

  private handleFocusOut(event: FocusEvent) {
    const { relatedTarget } = event;

    // Focus moved to a descendant, modal or popover
    if (
      relatedTarget instanceof Element &&
      (this.contains(relatedTarget) ||
        relatedTarget.closest("dialog[open], [popover]:popover-open"))
    ) {
      return;
    }

    this.clearSelection();
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
    this.endEditingColumn();
    this.selection.add(selection);
    this.rangeSelection = "anchor" in selection ? selection : null;
    this.redrawSelection();
    this.dispatchEvent(new TableEvent("tableselectionchange"));
  }

  private addSelection(selection: Selection) {
    this.selection.add(selection);
    this.rangeSelection = "anchor" in selection ? selection : null;
    this.redrawSelection();
    this.dispatchEvent(new TableEvent("tableselectionchange"));
  }

  private clearSelection() {
    this.selection.clear();
    this.stopDraggingRangeSelection();
    this.rangeSelection = null;
    this.endEditingCell();
    this.endEditingColumn();
    this.redrawSelection();

    const focused = getFocusedDescendant(this);
    if (focused instanceof HTMLElement) {
      focused.blur();
    }

    this.dispatchEvent(new TableEvent("tableselectionchange"));
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
        case "range":
          this.drawRangeSelection(selection);
          break;
        case "column":
          this.drawColumnSelection(selection);
          break;
        case "row":
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

  private drawColumnSelection({ column }: ColumnSelection) {
    column.element.classList.add("selected");
    column.header?.classList.add("selected");
  }

  private drawRowSelection({ row }: RowSelection) {
    row.element.classList.add("selected");
  }

  private getSelectionFocus() {
    const selection = Array.from(this.selection)[0];
    return selection && "focus" in selection ? selection.focus : null;
  }

  private focusRowStart(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        column: this.getColumnAtIndex(0),
      },
      expandSelection,
    );
  }

  private focusRowEnd(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        column: this.getColumnAtIndex(this.columns - 1),
      },
      expandSelection,
    );
  }

  private focusCellBefore(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        column: this.getColumnAtIndex(Math.max(focus.column.index - 1, 0)),
      },
      expandSelection,
    );
  }

  private focusCellAfter(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        column: this.getColumnAtIndex(
          Math.min(focus.column.index + 1, this.#columns - 1),
        ),
      },
      expandSelection,
    );
  }

  private focusColumnStart(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        row: this.getRowAtIndex(0),
      },
      expandSelection,
    );
  }

  private focusColumnEnd(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        row: this.getRowAtIndex(this.rows - 1),
      },
      expandSelection,
    );
  }

  private focusCellAbove(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        row: this.getRowAtIndex(Math.max(focus.row.index - 1, 0)),
      },
      expandSelection,
    );
  }

  private focusCellBelow(expandSelection = false) {
    const focus = this.getSelectionFocus();
    if (!focus) {
      return;
    }
    this.moveSelectionFocus(
      {
        ...focus,
        row: this.getRowAtIndex(Math.min(focus.row.index + 1, this.#rows - 1)),
      },
      expandSelection,
    );
  }

  private moveSelectionFocus(cell: Cell, expandSelection = false) {
    if (this.rangeSelection && expandSelection) {
      this.rangeSelection.focus = cell;
      if (!isCellEqual(this.rangeSelection.anchor, this.rangeSelection.focus)) {
        this.endEditingCell();
      }
      this.redrawSelection();
    } else {
      this.setSelection({ type: "range", anchor: cell, focus: cell });
      this.querySelector<HTMLTableCellElement>(
        `tr[aria-rowindex="${cell.row.index}"] > td[aria-colindex="${cell.column.index}"]`,
      )?.focus();
    }
  }

  private endEditingCell() {
    if (!this.editingCell) {
      return;
    }

    this.editingCell.dispatchEvent(
      new TableEvent("edittablecellend", {
        ...this.getCellInfo(this.editingCell),
        bubbles: true,
        cancelable: false,
      }),
    );
    this.editingCell = null;
  }

  private endEditingColumn() {
    const column = this.editingColumn;
    if (!column) {
      return;
    }
    this.editingColumn = null;
    column.header?.classList.remove("edit");
    column.element.dispatchEvent(
      new TableEvent("edittablecolumnend", {
        column,
        bubbles: true,
        cancelable: false,
      }),
    );
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
    for (let i = this.rowBuffer.length; i < ROW_BUFFER_MIN_SIZE; i++) {
      this.rowBuffer.push(this.createRow());
    }
  }

  private fillCellBuffer() {
    for (let i = this.buffer.length; i < CELL_BUFFER_MIN_SIZE; i++) {
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

  private getCell(row: Row, column: Column) {
    if (this.buffer.length === 0) {
      this.fillCellBuffer();
    }

    const cell = this.buffer.pop()!;
    cell.ariaColIndex = column.index.toString();
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
    { id, title, width }: { id?: string; title?: string | null; width: number },
  ) {
    if (!this.colGroup || !this.tableHead) {
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

    const span = document.createElement("span");
    span.textContent = title ?? null;

    th.append(span, this.createResizeHandle());
    makeDraggable(th, { constrain: "horizontal", clone: true });

    const column = new Column({ table: this, id, title, width, element: col });

    this.visibleColumns.splice(position, 0, column);
    const headerRow = this.tableHead.rows[0]!;
    headerRow.insertBefore(th, headerRow.children[position + 1] ?? null);

    for (const row of this.visibleRows) {
      const cell = this.getCell(row, column);
      row.element.insertBefore(
        cell,
        row.element.children[position + 1] ?? null,
      );
    }
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

    const element = this.getRowFromBuffer();
    if (element.id) {
      element.dataset.id = id;
    }
    element.style.height = height + "px";
    element.ariaRowIndex = rowIndex.toString();

    const row = new Row({ table: this, id, height, element });
    this.visibleRows.splice(position, 0, row);

    for (const column of this.visibleColumns) {
      const cell = this.getCell(row, column);
      element.append(cell);
    }

    this.tableBody.insertBefore(element, this.tableBody.rows[position] ?? null);
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
      const properties = this.getColumn(index);
      this.insertColumn(0, index, properties);
      this.firstVisibleColumn--;
      this.translateX -= properties.width;
      this.contentWidth += properties.width;
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
      const properties = this.getColumn(index);
      this.insertColumn(this.visibleColumns.length, index, properties);
      this.contentWidth += properties.width;
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
    const averageRowHeight =
      this.visibleRows.length > 0
        ? this.contentHeight / this.visibleRows.length
        : 0;
    const height = this.#rows * averageRowHeight + this.footerHeight;
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

  private updateFooter() {
    if (this.editable) {
      this.showFooter();
    } else {
      this.hideFooter();
    }
  }

  private showFooter() {
    if (!this.table || this.footer) {
      return;
    }

    const foot = document.createElement("tfoot");
    const row = foot.insertRow();
    const th = document.createElement("th");
    const button = document.createElement("button");
    button.type = "button";
    button.ariaLabel = "Append row";
    button.dataset.tooltip = "Append row";
    button.innerHTML = newIcon;
    button.addEventListener("click", this.appendRow.bind(this));
    th.appendChild(button);
    row.appendChild(th);
    this.table.tFoot = foot;

    const rect = foot.getBoundingClientRect();
    this.footerHeight = rect.height;
  }

  private hideFooter() {
    if (!this.table || !this.footer) {
      return;
    }

    this.footerHeight = 0;
    this.table.tFoot = null;
  }

  appendRow() {
    this.dispatchEvent(
      new TableEvent("appendtablerow", { bubbles: true, cancelable: false }),
    );
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
