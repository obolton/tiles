import type { DragDropEvent } from "@/utils/drag";

declare global {
  interface WindowEventHandlersEventMap {
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
    "dnd-dragstart": DragDropEvent;
    "dnd-dragend": DragDropEvent;
    "dnd-dragenter": DragDropEvent;
    "dnd-dragleave": DragDropEvent;
    "dnd-drag": DragDropEvent;
    "dnd-dragover": DragDropEvent;
    "dnd-drop": DragDropEvent;
  }

  interface HTMLElementEventMap {
    beforetoggle: ToggleEvent;
    toggle: ToggleEvent;
    upload: import("@/elements/filePicker/FilePicker").FilePickerEvent;
    "dnd-dragstart": DragDropEvent;
    "dnd-dragend": DragDropEvent;
    "dnd-dragenter": DragDropEvent;
    "dnd-dragleave": DragDropEvent;
    "dnd-drag": DragDropEvent;
    "dnd-dragover": DragDropEvent;
    "dnd-drop": DragDropEvent;
  }
}

export {};
