import type { DragDropEvent } from "@/utils/drag";
import type { TileResizeEvent, TileEvent } from "@/utils/events";

declare global {
  interface WindowEventHandlersEventMap {
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
    "modal:show": import("@/utils/modals").ModalEvent<unknown>;
    "modal:remove": import("@/utils/modals").ModalEvent<unknown>;
    "dnd-dragstart": DragDropEvent;
    "dnd-dragend": DragDropEvent;
    "dnd-dragenter": DragDropEvent;
    "dnd-dragleave": DragDropEvent;
    "dnd-drag": DragDropEvent;
    "dnd-dragover": DragDropEvent;
    "dnd-drop": DragDropEvent;
    tileresizestart: TileResizeEvent;
    tileresize: TileResizeEvent;
    tileresizeend: TileResizeEvent;
    tiledelete: TileEvent;
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
    tileresizestart: TileResizeEvent;
    tileresize: TileResizeEvent;
    tileresizeend: TileResizeEvent;
    tiledelete: TileEvent;
  }
}

export {};
