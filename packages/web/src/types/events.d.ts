declare global {
  interface WindowEventHandlersEventMap {
    "resize:resize": ResizeEvent;
    "resize:end": ResizeEvent;
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
    "modal:show": import("@/utils/modals").ModalEvent<unknown>;
    "modal:remove": import("@/utils/modals").ModalEvent<unknown>;
  }

  interface HTMLElementEventMap {
    beforetoggle: ToggleEvent;
    toggle: ToggleEvent;
    upload: import("@/components/forms/FilePicker").FilePickerEvent;
    "drag:drag-over": import("@/utils/drag").DragDropEvent;
    "drag:drop-on": import("@/utils/drag").DragDropEvent;
    "drag:drop": import("@/utils/drag").DragDropEvent;
  }
}

export {};
