export type TableEventType = "resizetablecolumn";

export interface TableEventInit extends EventInit {
  column?: number;
  row?: number;
  width?: number;
}

export class TableEvent extends Event {
  readonly column?: number;
  readonly row?: number;
  readonly width?: number;

  constructor(type: TableEventType, options?: TableEventInit) {
    const { column, row, width, ...init } = options || {};
    super(type, init);
    this.column = column;
    this.row = row;
    this.width = width;
  }
}
