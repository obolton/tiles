export interface MapEventMap {
  mapselectionchange: MapEvent;
}

declare global {
  interface HTMLElementEventMap extends MapEventMap {}
}

export interface MapEventInit extends EventInit {
  markerId?: string;
}

export default class MapEvent extends Event {
  readonly markerId?: string;

  constructor(type: keyof MapEventMap, options?: MapEventInit) {
    super(type, { bubbles: true, cancelable: false, ...options });
    this.markerId = options?.markerId;
  }
}
