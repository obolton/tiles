declare global {
  interface WindowEventHandlersEventMap {
    "drag:drag-over": DragDropEvent;
    "drag:drop": DragDropEvent;
  }
}

export {};
