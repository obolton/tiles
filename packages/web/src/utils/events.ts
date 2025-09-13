export type TileResizeEventType =
  | "tileresizestart"
  | "tileresize"
  | "tileresizeend";

export interface TileResizeEventInit extends EventInit {
  width: number;
  height: number;
}

export class TileResizeEvent extends Event {
  readonly width: number;
  readonly height: number;

  constructor(type: TileResizeEventType, options?: TileResizeEventInit) {
    super(type, options);
    this.width = options?.width ?? 0;
    this.height = options?.height ?? 0;
  }
}
