import Column from "./Column";
import Row from "./Row";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { TableEvent } from "./events";
import { makeDraggable } from "@/utils/drag";
import { moveBefore } from "jsx/move-before";
import { getFocusedDescendant } from "@/utils/focus";
import { getBackgroundStyle } from "@/utils/backgrounds";
import css from "./TableView.css?inline";
import newIcon from "@/icons/new.svg?raw";
import type { ResizeEvent } from "@/elements/resize/events";
import type { DragDropEvent } from "@/utils/drag";
import type { Fill } from "@/components/fills/types";
import { applyListChange } from "reactivity";
import type { Reactive, ReactiveList, ListChange } from "reactivity";
import type { StyleDeclaration, GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface RowItem {
  readonly id: string;
  readonly height: Reactive<number>;
  readonly style?: Reactive<StyleDeclaration | undefined>;
}

export interface ColumnItem {
  readonly id: string;
  readonly width: Reactive<number>;
  readonly title?: Reactive<string | null>;
  readonly style?: Reactive<StyleDeclaration | undefined>;
}

export interface TableViewAttributes extends GlobalHTMLAttributes {
  editable?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "table-view": TableView;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "table-view": TableViewAttributes;
  }
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

function isCellEqual(a: Cell, b: Cell) {
  return a.row.index === b.row.index && a.column.index === b.column.index;
}

function referencedIds(selection: Selection) {
  switch (selection.type) {
    case "row":
      return [selection.row.id];
    case "column":
      return [selection.column.id];
    case "range":
      return [
        selection.anchor.row.id,
        selection.anchor.column.id,
        selection.focus.row.id,
        selection.focus.column.id,
      ];
  }
}

const HEADER_SIZE = 32;
const ROW_BUFFER_MIN_SIZE = 3;
const CELL_BUFFER_MIN_SIZE = 10;

export default class TableView extends HTMLElement {
  static readonly observedAttributes: (keyof TableViewAttributes)[] = ["editable"] as const;

  #columns?: ReactiveList<ColumnItem>;
  #rows?: ReactiveList<RowItem>;
  #unsubscribeColumns?: () => void;
  #unsubscribeRows?: () => void;
  #editable = false;

  readonly selection = new Set<Selection>();
  updateCell?: (row: Row, column: Column, cell: HTMLTableCellElement) => void;

  get #columnCount() {
    return this.#columns?.value.length ?? 0;
  }

  get #rowCount() {
    return this.#rows?.value.length ?? 0;
  }

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

  get columns(): ReactiveList<ColumnItem> | undefined {
    return this.#columns;
  }

  set columns(list: ReactiveList<ColumnItem> | undefined) {
    this.#unsubscribeColumns?.();
    this.#columns = list;
    this.#unsubscribeColumns = list?.subscribe((_, change) => this.applyColumnChange(change));
    this.update();
  }

  get rows(): ReactiveList<RowItem> | undefined {
    return this.#rows;
  }

  set rows(list: ReactiveList<RowItem> | undefined) {
    this.#unsubscribeRows?.();
    this.#rows = list;
    this.#unsubscribeRows = list?.subscribe((_, change) => this.applyRowChange(change));
    this.update();
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

  refreshCell(rowId: string, columnId: string) {
    const row = this.visibleRows.find((candidate) => candidate.id === rowId);
    const column = this.visibleColumns.find((candidate) => candidate.id === columnId);
    if (!row || !column) {
      return;
    }

    const cell = row.cellAt(column.index);
    if (cell) {
      this.updateCell?.(row, column, cell);
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
    const firstColumn = this.colGroup.children[1] as HTMLTableColElement | undefined;

    this.firstVisibleRow = firstRow?.ariaRowIndex ? parseInt(firstRow.ariaRowIndex, 10) : 0;
    this.firstVisibleColumn = firstColumn?.dataset.index
      ? parseInt(firstColumn.dataset.index, 10)
      : 0;

    const headerRow = this.tableHead.rows[0];
    for (let i = 1; i < this.colGroup.childElementCount; i++) {
      const column = this.colGroup.children[i] as HTMLTableColElement;
      const header = headerRow?.cells[i];
      const { width } = column.getBoundingClientRect();
      const index = column.dataset.index ? parseInt(column.dataset.index, 10) : i - 1;
      const title = header?.querySelector("span")?.textContent ?? null;
      this.visibleColumns.push(
        new Column({
          table: this,
          id: column.dataset.id,
          title,
          index,
          width,
          element: column,
        }),
      );
    }

    for (const row of this.tableBody.rows) {
      const { height } = row.getBoundingClientRect();
      const index = row.ariaRowIndex ? parseInt(row.ariaRowIndex, 10) : 0;
      this.visibleRows.push(
        new Row({
          table: this,
          id: row.dataset.id,
          index,
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

    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback.bind(this));
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
      case "blur":
        return this.handleBlur(event as FocusEvent);
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
    this.update();
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Column title input handling
    if (event.target instanceof HTMLInputElement && event.target.closest("th[scope='col']")) {
      switch (event.key) {
        case "Enter":
          event.preventDefault();
          this.commitColumnTitleEdit();
          break;
        case "Escape":
          event.preventDefault();
          this.cancelColumnTitleEdit();
          break;
      }
      return;
    }

    // Cell handling
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

  private handleBlur(event: FocusEvent) {
    if (event.target instanceof HTMLInputElement && event.target.closest("th[scope='col']")) {
      this.commitColumnTitleEdit();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || !this.editable || event.defaultPrevented) {
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
      target.ariaColIndex &&
      target.parentElement
    ) {
      event.stopPropagation();
      const index = Array.prototype.indexOf.call(target.parentElement.children, target) - 1;
      const column = this.visibleColumns[index];
      if (column) {
        const selection: ColumnSelection = { type: "column", column };
        if (event.shiftKey) {
          this.addSelection(selection);
        } else {
          this.setSelection(selection);

          if (this.editingColumn !== column) {
            this.endEditingColumn();
            this.startEditingColumn(column);
            if (this.editingColumn === column) {
              event.preventDefault();
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
      target.parentElement instanceof HTMLTableRowElement
    ) {
      const ariaRowIndex = target.parentElement.ariaRowIndex;
      if (!ariaRowIndex) {
        return;
      }
      event.stopPropagation();
      const index = parseInt(ariaRowIndex, 10);
      const row = this.getRowAtIndex(index);
      const selection: RowSelection = { type: "row", row };
      if (event.shiftKey) {
        this.addSelection(selection);
      } else {
        this.setSelection(selection);
      }
      return;
    }

    // Cell selection
    if (target.tagName === "TD" && target.ariaColIndex && target.parentElement?.ariaRowIndex) {
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
    if (!this.isDraggingRange || !this.rangeSelection || !(event.target instanceof Element)) {
      return;
    }

    const cell = event.target.closest("td");
    if (cell) {
      this.moveSelectionFocus(this.getCellInfo(cell), true);
    }
  }

  private handleResizeEnd(event: ResizeEvent) {
    const target = event.currentTarget as HTMLElement;
    const th = target.closest("th");
    if (!th?.parentElement) {
      return;
    }

    if (th.scope === "col") {
      this.handleColumnResizeEnd(th, event);
    } else if (th.scope === "row") {
      this.handleRowResizeEnd(th, event);
    }
  }

  private handleColumnResizeEnd(th: HTMLTableCellElement, event: ResizeEvent) {
    if (!this.colGroup || !th.parentElement) {
      return;
    }

    const columnIndex = Array.prototype.indexOf.call(th.parentElement.children, th) - 1;

    const column = this.visibleColumns[columnIndex];
    if (!column) {
      return;
    }

    const width = column.width + event.x;
    this.dispatchEvent(new TableEvent("updatetablecolumn", { column, width }));

    column.width = width;

    this.update();
  }

  private handleRowResizeEnd(th: HTMLTableCellElement, event: ResizeEvent) {
    const tr = th.parentElement;
    if (!(tr instanceof HTMLTableRowElement) || !tr.ariaRowIndex) {
      return;
    }

    const rowIndex = parseInt(tr.ariaRowIndex, 10);
    const row = this.getRowAtIndex(rowIndex);

    const height = row.height + event.y;
    this.dispatchEvent(new TableEvent("resizetablerow", { row, height }));

    row.height = height;

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
        indicator.style.setProperty("--translate-x", HEADER_SIZE + offset + "px");
      });
    }

    if (element.scope === "row") {
      const { offset } = this.getRowDropTarget(event.clientY);
      const indicator = this.showDropIndicator(false);
      requestAnimationFrame(() => {
        indicator.style.setProperty("--translate-y", HEADER_SIZE + offset + "px");
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

    if (element.scope === "col" && element.ariaColIndex && element.parentElement) {
      const columnIndex = parseInt(element.ariaColIndex, 10);
      const column = this.getColumnAtIndex(columnIndex);
      const { index } = this.getColumnDropTarget(event.clientX);

      this.hideDropIndicator();

      const afterColumn = index >= 0 ? this.visibleColumns[index] : null;
      this.dispatchEvent(
        new TableEvent("movetablecolumn", {
          column,
          afterIndex: index,
          afterId: afterColumn?.id ?? null,
        }),
      );

      return;
    }

    if (element.scope === "row" && element.parentElement instanceof HTMLTableRowElement) {
      const rowElement = element.parentElement;
      const ariaRowIndex = rowElement.ariaRowIndex;
      if (!ariaRowIndex) {
        return;
      }
      const { index } = this.getRowDropTarget(event.clientY);
      const rowIndex = parseInt(ariaRowIndex, 10);
      const row = this.getRowAtIndex(rowIndex);

      this.hideDropIndicator();

      const afterRow = index >= 0 ? this.visibleRows[index] : null;
      this.dispatchEvent(
        new TableEvent("movetablerow", {
          row,
          afterIndex: index,
          afterId: afterRow?.id ?? null,
        }),
      );

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
    const rowElement = element.parentElement;
    if (
      !(rowElement instanceof HTMLTableRowElement) ||
      !rowElement.ariaRowIndex ||
      !element.ariaColIndex
    ) {
      throw new Error("Cell is disconnected");
    }
    const rowIndex = parseInt(rowElement.ariaRowIndex, 10);
    const columnIndex = parseInt(element.ariaColIndex, 10);
    return {
      row: this.getRowAtIndex(rowIndex),
      column: this.getColumnAtIndex(columnIndex),
    };
  }

  private getRowAtIndex(index: number) {
    const position = index - this.firstVisibleRow;
    const row = this.visibleRows[position];
    if (!row) {
      throw new Error(`Invalid row index: ${index}`);
    }
    return row;
  }

  private getColumnAtIndex(index: number) {
    const position = index - this.firstVisibleColumn;
    const column = this.visibleColumns[position];
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
    for (const selected of Array.from(this.getElementsByClassName("selected"))) {
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
    const startRow = Math.min(selection.anchor.row.index, selection.focus.row.index);
    const endRow = Math.max(selection.anchor.row.index, selection.focus.row.index);
    const startColumn = Math.min(selection.anchor.column.index, selection.focus.column.index);
    const endColumn = Math.max(selection.anchor.column.index, selection.focus.column.index);

    const startVisibleRow = Math.max(startRow, this.firstVisibleRow);
    const endVisibleRow = Math.min(endRow, this.firstVisibleRow + this.visibleRows.length - 1);
    const startVisibleColumn = Math.max(startColumn, this.firstVisibleColumn);
    const endVisibleColumn = Math.min(
      endColumn,
      this.firstVisibleColumn + this.visibleColumns.length - 1,
    );

    const startRowIndex = startVisibleRow - this.firstVisibleRow;
    const endRowIndex = endVisibleRow - this.firstVisibleRow;
    const startColIndex = startVisibleColumn - this.firstVisibleColumn;
    const endColIndex = endVisibleColumn - this.firstVisibleColumn;

    for (let i = startRowIndex; i <= endRowIndex; i++) {
      const row = this.visibleRows[i];
      if (!row) {
        continue;
      }

      for (let j = startColIndex; j <= endColIndex; j++) {
        const cell = row.element.cells[j + 1];
        if (cell?.tagName === "TD") {
          cell.classList.add("selected");
        }
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
        column: this.getColumnAtIndex(this.#columnCount - 1),
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
        column: this.getColumnAtIndex(Math.min(focus.column.index + 1, this.#columnCount - 1)),
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
        row: this.getRowAtIndex(this.#rowCount - 1),
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
        row: this.getRowAtIndex(Math.min(focus.row.index + 1, this.#rowCount - 1)),
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

  private startEditingColumn(column: Column) {
    const header = column.header;
    if (!header) {
      return;
    }

    this.editingColumn = column;
    header.classList.add("edit");

    const input = document.createElement("input");
    input.type = "text";
    input.value = column.title ?? "";
    header.appendChild(input);
    input.focus();
    input.select();

    input.addEventListener("blur", this, {
      signal: this.editAbortController?.signal,
    });
    input.addEventListener("keydown", this, {
      signal: this.editAbortController?.signal,
    });
  }

  private commitColumnTitleEdit() {
    const column = this.editingColumn;
    if (!column) {
      return;
    }

    const header = column.header;
    const input = header?.querySelector<HTMLInputElement>("input");
    const span = column.titleSpan;
    if (!header || !input || !span) {
      return;
    }

    const newTitle = input.value;
    const titleChanged = newTitle !== column.title;

    // Clear state before removing input to prevent blur handler re-entry
    this.editingColumn = null;

    span.textContent = newTitle;
    column.title = newTitle;
    header.classList.remove("edit");
    input.remove();

    if (titleChanged) {
      this.dispatchEvent(new TableEvent("updatetablecolumn", { column, title: newTitle }));
    }
  }

  private cancelColumnTitleEdit() {
    const column = this.editingColumn;
    if (!column) {
      return;
    }

    const header = column.header;
    const input = header?.querySelector<HTMLInputElement>("input");
    if (!header || !input) {
      return;
    }

    // Clear state before removing input to prevent blur handler re-entry
    this.editingColumn = null;

    header.classList.remove("edit");
    input.remove();
  }

  private endEditingColumn() {
    if (this.editingColumn) {
      this.commitColumnTitleEdit();
    }
  }

  // Data access

  private getColumn(index: number) {
    const column = this.#columns?.value[index];
    if (!column) {
      throw new Error(`No column at index ${index}`);
    }
    return {
      id: column.id,
      title: column.title?.value ?? null,
      width: column.width.value,
      style: column.style?.value,
    };
  }

  private getRow(index: number) {
    const row = this.#rows?.value[index];
    if (!row) {
      throw new Error(`No row at index ${index}`);
    }
    return {
      id: row.id,
      height: row.height.value,
      style: row.style?.value,
    };
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
    if (this.editable) {
      makeDraggable(th, {
        constrain: "vertical",
        clone: true,
        signal: this.editAbortController?.signal,
      });
      th.appendChild(this.createRowResizeHandle());
    }
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

    const cell = this.buffer.pop() ?? this.createCell();
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
    row.removeAttribute("style");

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
    return this.rowBuffer.pop() ?? this.createRow();
  }

  private insertColumn(
    position: number,
    columnIndex: number,
    {
      id,
      title,
      width,
      style,
    }: {
      id?: string;
      title?: string | null;
      width: number;
      style?: StyleDeclaration;
    },
  ) {
    if (!this.colGroup || !this.tableHead) {
      return;
    }

    // Reference the column currently at this position (not a DOM index), so the
    // insertion is correct even while a move's detached nodes linger in the DOM.
    const reference = this.visibleColumns[position] ?? null;

    const col = document.createElement("col");
    col.dataset.index = columnIndex.toString();
    Object.assign(col.style, style);
    this.colGroup.insertBefore(col, reference?.element ?? null);

    const th = document.createElement("th");
    th.scope = "col";
    th.ariaColIndex = columnIndex.toString();

    const span = document.createElement("span");
    span.textContent = title ?? null;

    th.appendChild(span);
    if (this.editable) {
      th.appendChild(this.createResizeHandle());
      makeDraggable(th, {
        constrain: "horizontal",
        clone: true,
        signal: this.editAbortController?.signal,
      });
    }

    const column = new Column({
      table: this,
      id,
      title,
      index: columnIndex,
      width,
      element: col,
    });

    this.tableHead.rows[0]!.insertBefore(th, reference?.header ?? null);

    const referenceCells = reference?.cells;
    this.visibleRows.forEach((row, index) => {
      row.element.insertBefore(this.getCell(row, column), referenceCells?.[index] ?? null);
    });

    this.visibleColumns.splice(position, 0, column);
  }

  private insertRow(
    position: number,
    rowIndex: number,
    height: number,
    id?: string,
    style?: StyleDeclaration,
  ) {
    if (!this.tableBody) {
      return;
    }

    // Reference the row currently at this position (not a DOM index), so
    // insertion is correct even while a move's detached node lingers in the DOM.
    const reference = this.visibleRows[position]?.element ?? null;
    const element = this.getRowFromBuffer();
    if (id) {
      element.dataset.id = id;
    }
    Object.assign(element.style, style);

    const row = new Row({ table: this, id, index: rowIndex, height, element });
    for (const column of this.visibleColumns) {
      element.append(this.getCell(row, column));
    }

    this.tableBody.insertBefore(element, reference);
    this.visibleRows.splice(position, 0, row);
  }

  private fillTop() {
    while (this.firstVisibleRow > 0 && this.scrollTop - this.translateY < this.verticalBufferSize) {
      const index = this.firstVisibleRow - 1;
      const { id, height, style } = this.getRow(index);
      this.insertRow(0, index, height, id, style);
      this.firstVisibleRow--;
      this.translateY -= height;
      this.contentHeight += height;
    }

    this.reposition();
  }

  private fillBottom() {
    while (
      this.firstVisibleRow + this.visibleRows.length < this.#rowCount &&
      this.translateY - this.scrollTop + this.contentHeight - this.height < this.verticalBufferSize
    ) {
      const index = this.firstVisibleRow + this.visibleRows.length;
      const { id, height, style } = this.getRow(index);
      this.insertRow(this.visibleRows.length, index, height, id, style);
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
      this.firstVisibleColumn + this.visibleColumns.length < this.#columnCount &&
      this.translateX - this.scrollLeft + this.contentWidth - this.width < this.horizontalBufferSize
    ) {
      const index = this.firstVisibleColumn + this.visibleColumns.length;
      const properties = this.getColumn(index);
      this.insertColumn(this.visibleColumns.length, index, properties);
      this.contentWidth += properties.width;
    }
  }

  private drainTop() {
    let row = this.visibleRows[0];

    while (row && this.scrollTop - this.translateY - row.height > this.verticalBufferSize) {
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

    while (row && this.contentHeight - bottom - row.height > this.verticalBufferSize) {
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

    while (column && this.scrollLeft - this.translateX - column.width > this.horizontalBufferSize) {
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

    while (column && this.contentWidth - right - column.width > this.horizontalBufferSize) {
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

  private applyRowChange(change: ListChange<RowItem>) {
    if (!this.virtualize) {
      return;
    }
    applyListChange<RowItem, HTMLTableRowElement | null>(change, {
      remove: (item, index) => this.removeRow(item, index),
      detach: (item, index) => this.detachRow(item, index),
      insert: (item, index) => this.addRow(item, index),
      attach: (item, index, element) =>
        element ? this.moveRow(item, index, element) : this.addRow(item, index),
    });
    this.reindexRows();
    this.pruneSelection(new Set(change.removed.map((entry) => entry.item.id)));
    this.update();
    this.reposition();
  }

  private takeVisibleRow(index: number): Row | null {
    const position = index - this.firstVisibleRow;
    if (position < 0 || position >= this.visibleRows.length) {
      return null;
    }
    const row = this.visibleRows[position]!;
    this.visibleRows.splice(position, 1);
    this.contentHeight -= row.height;
    return row;
  }

  private detachRow(item: RowItem, index: number): HTMLTableRowElement | null {
    const row = this.takeVisibleRow(index);
    if (row) {
      return row.element;
    }
    if (index < this.firstVisibleRow) {
      this.firstVisibleRow--;
      this.translateY -= item.height.value;
    }
    return null;
  }

  private removeRow(item: RowItem, index: number) {
    const element = this.detachRow(item, index);
    if (element) {
      this.recycleRow(element);
    }
  }

  private addRow(item: RowItem, index: number) {
    const position = index - this.firstVisibleRow;
    if (position < 0) {
      this.firstVisibleRow++;
      this.translateY += item.height.value;
      return;
    }
    if (position > this.visibleRows.length) {
      return; // below the rendered window
    }
    this.insertRow(position, index, item.height.value, item.id, item.style?.value);
    this.contentHeight += item.height.value;
  }

  private moveRow(item: RowItem, index: number, element: HTMLTableRowElement) {
    const position = index - this.firstVisibleRow;
    if (position < 0) {
      this.firstVisibleRow++;
      this.translateY += item.height.value;
      this.recycleRow(element); // moved above the window; no longer rendered
      return;
    }
    if (position > this.visibleRows.length) {
      this.recycleRow(element); // moved below the window
      return;
    }
    moveBefore(this.tableBody!, element, this.visibleRows[position]?.element ?? null);
    this.visibleRows.splice(
      position,
      0,
      new Row({
        table: this,
        id: item.id,
        index,
        height: item.height.value,
        element,
      }),
    );
    this.contentHeight += item.height.value;
  }

  private applyColumnChange(change: ListChange<ColumnItem>) {
    if (!this.virtualize) {
      return;
    }
    applyListChange<ColumnItem, Column | null>(change, {
      remove: (item, index) => this.removeColumn(item, index),
      detach: (item, index) => this.detachColumn(item, index),
      insert: (item, index) => this.addColumn(item, index),
      attach: (item, index, column) =>
        column ? this.moveColumn(item, index, column) : this.addColumn(item, index),
    });
    this.reindexColumns();
    this.pruneSelection(new Set(change.removed.map((entry) => entry.item.id)));
    this.update();
    this.reposition();
  }

  private takeVisibleColumn(index: number): Column | null {
    const position = index - this.firstVisibleColumn;
    if (position < 0 || position >= this.visibleColumns.length) {
      return null;
    }
    const column = this.visibleColumns[position]!;
    this.visibleColumns.splice(position, 1);
    this.contentWidth -= column.width;
    return column;
  }

  private detachColumn(item: ColumnItem, index: number): Column | null {
    const column = this.takeVisibleColumn(index);
    if (column) {
      return column;
    }
    if (index < this.firstVisibleColumn) {
      this.firstVisibleColumn--;
      this.translateX -= item.width.value;
    }
    return null;
  }

  private removeColumn(item: ColumnItem, index: number) {
    const column = this.detachColumn(item, index);
    if (column) {
      this.recycleColumn(column);
    }
  }

  private addColumn(item: ColumnItem, index: number) {
    const position = index - this.firstVisibleColumn;
    if (position < 0) {
      this.firstVisibleColumn++;
      this.translateX += item.width.value;
      return;
    }
    if (position > this.visibleColumns.length) {
      return; // beyond the rendered window
    }
    this.insertColumn(position, index, {
      id: item.id,
      title: item.title?.value,
      width: item.width.value,
      style: item.style?.value,
    });
    this.contentWidth += item.width.value;
  }

  private moveColumn(item: ColumnItem, index: number, column: Column) {
    const position = index - this.firstVisibleColumn;
    if (position < 0) {
      this.firstVisibleColumn++;
      this.translateX += item.width.value;
      this.recycleColumn(column); // moved before the window; no longer rendered
      return;
    }
    if (position > this.visibleColumns.length) {
      this.recycleColumn(column); // moved past the window
      return;
    }
    this.moveColumnBefore(column, this.visibleColumns[position] ?? null);
    this.visibleColumns.splice(position, 0, column);
    this.contentWidth += item.width.value;
  }

  private recycleColumn(column: Column) {
    column.element.remove();
    column.header?.remove();
    for (const cell of column.cells) {
      this.recycleCell(cell);
    }
  }

  private moveColumnBefore(column: Column, reference: Column | null) {
    if (!this.colGroup || !this.tableHead) {
      return;
    }
    moveBefore(this.colGroup, column.element, reference?.element ?? null);
    const header = column.header;
    if (header) {
      moveBefore(this.tableHead.rows[0]!, header, reference?.header ?? null);
    }
    const referenceCells = reference?.cells;
    column.cells.forEach((cell, row) => {
      moveBefore(cell.parentElement!, cell, referenceCells?.[row] ?? null);
    });
  }

  private pruneSelection(removedIds: ReadonlySet<string>) {
    if (removedIds.size === 0 || this.selection.size === 0) {
      return;
    }
    let changed = false;
    for (const selection of this.selection) {
      if (referencedIds(selection).some((id) => !!id && removedIds.has(id))) {
        this.selection.delete(selection);
        if (this.rangeSelection === selection) {
          this.rangeSelection = null;
        }
        changed = true;
      }
    }
    if (changed) {
      this.redrawSelection();
      this.dispatchEvent(new TableEvent("tableselectionchange"));
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

    const width = this.getColumnSpan(0, this.#columnCount);
    const averageRowHeight =
      this.visibleRows.length > 0 ? this.contentHeight / this.visibleRows.length : 0;
    const height = this.#rowCount * averageRowHeight + this.footerHeight;

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
        const th = row.cells[0];
        if (th?.tagName === "TH") {
          makeDraggable(th, {
            constrain: "vertical",
            clone: true,
            signal: this.editAbortController?.signal,
          });
          th.appendChild(this.createRowResizeHandle());
        }
      }
    } else {
      for (const handle of this.getElementsByTagName("resize-handle")) {
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
    this.dispatchEvent(new TableEvent("appendtablerow", { bubbles: true, cancelable: false }));
  }

  private createResizeHandle() {
    const handle = document.createElement("resize-handle");
    handle.addEventListener("resizeend", this, {
      signal: this.editAbortController?.signal,
    });
    return handle;
  }

  private createRowResizeHandle() {
    const handle = document.createElement("resize-handle");
    handle.setAttribute("direction", "vertical");
    handle.addEventListener("resizeend", this, {
      signal: this.editAbortController?.signal,
    });
    return handle;
  }

  private reindexColumns(fromIndex = 0) {
    if (!this.tableHead || !this.tableBody) {
      return;
    }

    for (let i = fromIndex; i < this.visibleColumns.length; i++) {
      this.visibleColumns[i]!.index = this.firstVisibleColumn + i;
    }

    const headerRow = this.tableHead.rows[0];
    if (headerRow) {
      for (let i = fromIndex + 1; i < headerRow.cells.length; i++) {
        headerRow.cells[i]!.ariaColIndex = (this.firstVisibleColumn + i - 1).toString();
      }
    }

    for (const row of this.tableBody.rows) {
      for (let i = fromIndex + 1; i < row.cells.length; i++) {
        row.cells[i]!.ariaColIndex = (this.firstVisibleColumn + i - 1).toString();
      }
    }
  }

  private reindexRows(fromIndex = 0) {
    for (let i = fromIndex; i < this.visibleRows.length; i++) {
      this.visibleRows[i]!.index = this.firstVisibleRow + i;
    }
  }

  setColumnBackground(id: string, background: Fill | null) {
    const column = this.visibleColumns.find((c) => c.id === id);
    if (column) {
      column.element.style.background = getBackgroundStyle(background)?.background ?? "";
    }
  }

  setRowBackground(id: string, background: Fill | null) {
    const row = this.visibleRows.find((r) => r.id === id);
    if (row) {
      row.element.style.background = getBackgroundStyle(background)?.background ?? "";
    }
  }
}

customElements.define("table-view", TableView);
