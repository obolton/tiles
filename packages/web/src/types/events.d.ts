declare global {
  interface WindowEventHandlersEventMap {
    "drag:drag-over": DragDropEvent;
    "drag:drop": DragDropEvent;
    "resize:start": ResizeEvent;
    "resize:resize": ResizeEvent;
    "resize:end": ResizeEvent;
    "resize:cancel": ResizeEvent;
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
    "modal:show": import("@/utils/modals").ModalEvent<unknown>;
    "modal:remove": import("@/utils/modals").ModalEvent<unknown>;
  }

  interface HTMLElementEventMap {
    beforetoggle: ToggleEvent;
    toggle: ToggleEvent;
    upload: import("@/components/forms/FilePicker").FilePickerEvent;
    "drag:drop-on": DragDropEvent;
  }
}

export {};
