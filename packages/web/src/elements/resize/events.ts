export type ResizeEventType = "resizestart" | "resizedrag" | "resizeend";

export interface ResizeEventMap {
  resizestart: ResizeEvent;
  resizedrag: ResizeEvent;
  resizeend: ResizeEvent;
}

declare global {
  interface HTMLElementEventMap extends ResizeEventMap {}
}

export interface ResizeEventInit extends EventInit {
  x?: number;
  y?: number;
}

export class ResizeEvent extends Event {
  readonly x: number;
  readonly y: number;

  constructor(type: ResizeEventType, options?: ResizeEventInit) {
    const { x, y, ...init } = options || {};
    super(type, init);
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
}
