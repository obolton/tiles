import type TableView from "./TableView";

export default class Row {
  id?: string;
  height: number;

  readonly table: TableView;
  readonly element: HTMLTableRowElement;

  constructor({
    table,
    id,
    height = 32,
    element,
  }: {
    table: TableView;
    id?: string;
    height?: number;
    element: HTMLTableRowElement;
  }) {
    this.table = table;
    this.id = id;
    this.height = height;
    this.element = element;
  }

  get index() {
    if (!this.element.ariaRowIndex) {
      throw new Error("No row index set");
    }
    return parseInt(this.element.ariaRowIndex, 10);
  }

  set index(value: number) {
    this.element.ariaRowIndex = value.toString();
  }

  get header() {
    return this.element.querySelector<HTMLTableCellElement>('th[scope="row"]');
  }

  get cells() {
    return this.element.cells;
  }
}
