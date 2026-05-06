export interface FilmstripEventMap {
  slideselect: FilmstripEvent;
  slidereorder: FilmstripEvent;
}

declare global {
  interface HTMLElementEventMap extends FilmstripEventMap {}
}

export interface FilmstripEventInit extends EventInit {
  slideId: string;
  beforeId?: string | null;
}

export class FilmstripEvent extends Event {
  readonly slideId: string;
  readonly beforeId: string | null;

  constructor(type: keyof FilmstripEventMap, options: FilmstripEventInit) {
    super(type, options);
    this.slideId = options.slideId;
    this.beforeId = options.beforeId ?? null;
  }
}
