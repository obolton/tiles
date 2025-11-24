import type TableView from "./TableView";

export default class Column {
  id?: string;
  title: string | null;
  width: number;

  readonly table: TableView;
  readonly element: HTMLTableColElement;

  #index: number;

  constructor({
    table,
    id,
    title,
    width = 100,
    index,
    element,
  }: {
    table: TableView;
    id?: string;
    title?: string | null;
    width?: number;
    index: number;
    element: HTMLTableColElement;
  }) {
    this.table = table;
    this.id = id;
    this.title = title ?? null;
    this.width = width;
    this.#index = index;
    this.element = element;

    this.element.dataset.index = index.toString();
  }

  get index() {
    return this.#index;
  }

  set index(value: number) {
    this.#index = value;
    this.element.dataset.index = value.toString();
  }

  get header() {
    return this.table.header.querySelector<HTMLTableCellElement>(
      `th[aria-colindex="${this.index}"]`,
    );
  }

  get cells() {
    return this.table.body.querySelectorAll<HTMLTableCellElement>(
      `td[aria-colindex="${this.index}"]`,
    );
  }
}
