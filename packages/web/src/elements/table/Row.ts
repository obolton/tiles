import type TableView from "./TableView";

export default class Row {
  id?: string;

  readonly table: TableView;
  readonly element: HTMLTableRowElement;

  #index: number;
  #height: number;

  constructor({
    table,
    id,
    height = 32,
    index,
    element,
  }: {
    table: TableView;
    id?: string;
    height?: number;
    index: number;
    element: HTMLTableRowElement;
  }) {
    this.table = table;
    this.id = id;
    this.#height = height;
    this.#index = index;
    this.element = element;

    this.element.ariaRowIndex = index.toString();
    this.element.style.height = height + "px";
  }

  get index() {
    return this.#index;
  }

  set index(value: number) {
    this.#index = value;
    this.element.ariaRowIndex = value.toString();
  }

  get height() {
    return this.#height;
  }

  set height(value: number) {
    this.#height = value;
    this.element.style.height = value + "px";
  }

  get header() {
    return this.element.querySelector<HTMLTableCellElement>('th[scope="row"]');
  }

  get cells() {
    return this.element.cells;
  }

  cellAt(columnIndex: number) {
    return this.element.querySelector<HTMLTableCellElement>(`td[aria-colindex="${columnIndex}"]`);
  }
}
