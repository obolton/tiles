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
    "dnd-dragstart": import("@/utils/drag").DragDropEvent;
    "dnd-dragend": import("@/utils/drag").DragDropEvent;
    "dnd-dragenter": import("@/utils/drag").DragDropEvent;
    "dnd-dragleave": import("@/utils/drag").DragDropEvent;
    "dnd-drag": import("@/utils/drag").DragDropEvent;
    "dnd-drop": import("@/utils/drag").DragDropEvent;
  }
}

export {};
