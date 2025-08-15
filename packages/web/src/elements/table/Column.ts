import type TableView from "./TableView";

export default class Column {
  id?: string;
  width: number;

  readonly table: TableView;
  readonly element: HTMLTableColElement;
  readonly header: HTMLTableCellElement;

  constructor({
    table,
    id,
    width = 100,
    element,
    header,
  }: {
    table: TableView;
    id?: string;
    width?: number;
    element: HTMLTableColElement;
    header: HTMLTableCellElement;
  }) {
    this.table = table;
    this.id = id;
    this.width = width;
    this.element = element;
    this.header = header;
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

  remove() {
    this.element.remove();
    this.header.remove();
  }
}
