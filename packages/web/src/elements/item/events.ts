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
}

export class PageItemEvent extends Event {
  readonly width: number;
  readonly height: number;

  constructor(type: keyof PageItemEventMap, options?: PageItemEventInit) {
    super(type, options);
    this.width = options?.width ?? 0;
    this.height = options?.height ?? 0;
  }
}
