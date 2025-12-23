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
  clientX: number;
  clientY: number;
  rect: DOMRect;
  direction?: ResizeHandleDirection | null;
}

export class PageItemEvent extends Event {
  readonly clientX: number;
  readonly clientY: number;
  readonly rect: DOMRect;
  readonly direction?: ResizeHandleDirection | null;

  constructor(type: keyof PageItemEventMap, options: PageItemEventInit) {
    super(type, options);
    this.clientX = options.clientX;
    this.clientY = options.clientY;
    this.rect = options.rect;
    this.direction = options.direction;
  }
}
