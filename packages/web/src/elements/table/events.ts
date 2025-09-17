import type Column from "./Column";
import type Row from "./Row";

export type TableEventType =
  | "resizetablecolumn"
  | "movetablecolumn"
  | "movetablerow";

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

  constructor(type: TableEventType, options?: TableEventInit) {
    const { column, row, width, afterIndex, ...init } = options || {};
    super(type, init);
    this.column = column;
    this.row = row;
    this.width = width;
    this.afterIndex = afterIndex;
  }
}
