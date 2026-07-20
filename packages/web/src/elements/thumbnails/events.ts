export interface ThumbnailListEventMap {
  slideselect: ThumbnailListEvent;
  slidereorder: ThumbnailListEvent;
}

declare global {
  interface HTMLElementEventMap extends ThumbnailListEventMap {}
}

export interface ThumbnailListEventInit extends EventInit {
  slideId: string;
  beforeId?: string | null;
}

export class ThumbnailListEvent extends Event {
  readonly slideId: string;
  readonly beforeId: string | null;

  constructor(type: keyof ThumbnailListEventMap, options: ThumbnailListEventInit) {
    super(type, options);
    this.slideId = options.slideId;
    this.beforeId = options.beforeId ?? null;
  }
}
