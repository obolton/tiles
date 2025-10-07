import type TableView from "./TableView";

export default class Column {
  id?: string;
  title: string | null;
  width: number;

  readonly table: TableView;
  readonly element: HTMLTableColElement;

  constructor({
    table,
    id,
    title,
    width = 100,
    element,
  }: {
    table: TableView;
    id?: string;
    title?: string | null;
    width?: number;
    element: HTMLTableColElement;
  }) {
    this.table = table;
    this.id = id;
    this.title = title ?? null;
    this.width = width;
    this.element = element;
  }

  get index() {
    if (!this.element.dataset.index) {
      throw new Error("No column index set");
    }
    return parseInt(this.element.dataset.index, 10);
  }

  set index(value: number) {
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
