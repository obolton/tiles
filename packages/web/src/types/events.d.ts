declare global {
  interface WindowEventHandlersEventMap {
    "drag:drag-over": DragDropEvent;
    "drag:drop": DragDropEvent;
    "resize:start": ResizeEvent;
    "resize:resize": ResizeEvent;
    "resize:end": ResizeEvent;
    "resize:cancel": ResizeEvent;
  }
}

export {};
