import type { ResizeHandleDirection } from "./PageItem";

export interface PageItemEventMap {
  itemresizestart: PageItemEvent;
  itemresize: PageItemEvent;
  itemresizeend: PageItemEvent;
}

declare global {
  interface HTMLElementEventMap extends PageItemEventMap {}
}

export interface PageItemEventInit extends EventInit {
  width: number;
  height: number;
  x?: number;
  y?: number;
  direction?: ResizeHandleDirection | null;
}

export class PageItemEvent extends Event {
  readonly width: number;
  readonly height: number;
  readonly x?: number;
  readonly y?: number;
  readonly direction?: ResizeHandleDirection | null;

  constructor(type: keyof PageItemEventMap, options?: PageItemEventInit) {
    super(type, options);
    this.width = options?.width ?? 0;
    this.height = options?.height ?? 0;
    this.x = options?.x;
    this.y = options?.y;
    this.direction = options?.direction;
  }
}
