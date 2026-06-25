export type PanelResizeEventType =
  | "panelresizestart"
  | "panelresize"
  | "panelresizeend";

export interface PanelResizeEventMap {
  panelresizestart: PanelResizeEvent;
  panelresize: PanelResizeEvent;
  panelresizeend: PanelResizeEvent;
}

declare global {
  interface HTMLElementEventMap extends PanelResizeEventMap {}
}

export interface PanelResizeEventInit extends EventInit {
  size: number;
}

export class PanelResizeEvent extends Event {
  readonly size: number;

  constructor(type: PanelResizeEventType, options: PanelResizeEventInit) {
    const { size, ...init } = options;
    super(type, init);
    this.size = size;
  }
}
