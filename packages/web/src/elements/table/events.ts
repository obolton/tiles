export type TableEventType = "resizetablecolumn" | "reordertablecolumn";

export interface TableEventInit extends EventInit {
  column?: number;
  row?: number;
  width?: number;
  newIndex?: number;
}

export class TableEvent extends Event {
  readonly column?: number;
  readonly row?: number;
  readonly width?: number;
  readonly newIndex?: number;

  constructor(type: TableEventType, options?: TableEventInit) {
    const { column, row, width, newIndex, ...init } = options || {};
    super(type, init);
    this.column = column;
    this.row = row;
    this.width = width;
    this.newIndex = newIndex;
  }
}
