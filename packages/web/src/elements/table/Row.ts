import type TableView from "./TableView";

export default class Row {
  id?: string;
  height: number;

  readonly table: TableView;
  readonly element: HTMLTableRowElement;

  #index: number;

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
    this.height = height;
    this.#index = index;
    this.element = element;

    this.element.ariaRowIndex = index.toString();
  }

  get index() {
    return this.#index;
  }

  set index(value: number) {
    this.#index = value;
    this.element.ariaRowIndex = value.toString();
  }

  get header() {
    return this.element.querySelector<HTMLTableCellElement>('th[scope="row"]');
  }

  get cells() {
    return this.element.cells;
  }
}
