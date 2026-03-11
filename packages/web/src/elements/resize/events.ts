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
  clientX?: number;
  clientY?: number;
}

export class ResizeEvent extends Event {
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;

  constructor(type: ResizeEventType, options?: ResizeEventInit) {
    const { x, y, clientX, clientY, ...init } = options || {};
    super(type, init);
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.clientX = clientX ?? 0;
    this.clientY = clientY ?? 0;
  }
}
