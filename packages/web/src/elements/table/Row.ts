import type TableView from "./TableView";

export default class Row {
  id?: string;

  readonly table: TableView;
  readonly element: HTMLTableRowElement;

  constructor({
    table,
    id,
    element,
  }: {
    table: TableView;
    id?: string;
    element: HTMLTableRowElement;
  }) {
    this.table = table;
    this.id = id;
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
