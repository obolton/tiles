import type Column from "./Column";
import type Row from "./Row";

export interface TableEventMap {
  resizetablecolumn: TableEvent;
  movetablecolumn: TableEvent;
  movetablerow: TableEvent;
  appendtablerow: TableEvent;
  cleartableselection: TableEvent;
  edittablecellstart: TableEvent;
  edittablecellend: TableEvent;
  edittablecolumnstart: TableEvent;
  edittablecolumnend: TableEvent;
}

declare global {
  interface HTMLElementEventMap extends TableEventMap {}
}

export interface TableEventInit extends EventInit {
  column?: Column;
  row?: Row;
  width?: number;
  afterIndex?: number;
}

export class TableEvent extends Event {
  readonly column?: Column;
  readonly row?: Row;
  readonly width?: number;
  readonly afterIndex?: number;

  constructor(type: keyof TableEventMap, options?: TableEventInit) {
    const { column, row, width, afterIndex, ...init } = options || {};
    super(type, init);
    this.column = column;
    this.row = row;
    this.width = width;
    this.afterIndex = afterIndex;
  }
}
