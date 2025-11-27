import type Column from "./Column";
import type Row from "./Row";

export interface TableEventMap {
  resizetablecolumn: TableEvent;
  resizetablerow: TableEvent;
  movetablecolumn: TableEvent;
  movetablerow: TableEvent;
  appendtablerow: TableEvent;
  cleartableselection: TableEvent;
  edittablecellstart: TableEvent;
  edittablecellend: TableEvent;
  edittablecolumnstart: TableEvent;
  edittablecolumnend: TableEvent;
  tableselectionchange: TableEvent;
}

declare global {
  interface HTMLElementEventMap extends TableEventMap {}
}

export interface TableEventInit extends EventInit {
  column?: Column;
  row?: Row;
  width?: number;
  height?: number;
  afterIndex?: number;
  afterId?: string | null;
}

export class TableEvent extends Event {
  readonly column?: Column;
  readonly row?: Row;
  readonly width?: number;
  readonly height?: number;
  readonly afterIndex?: number;
  readonly afterId?: string | null;

  constructor(type: keyof TableEventMap, options?: TableEventInit) {
    const { column, row, width, height, afterIndex, afterId, ...init } =
      options || {};
    super(type, init);
    this.column = column;
    this.row = row;
    this.width = width;
    this.height = height;
    this.afterIndex = afterIndex;
    this.afterId = afterId;
  }
}
