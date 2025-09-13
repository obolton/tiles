import type { DragDropEvent } from "@/utils/drag";
import type { TileResizeEvent } from "@/utils/events";
import type { ModalEvent } from "@/utils/modals";
import type { TableEvent } from "@/elements/table/events";

declare global {
  interface WindowEventHandlersEventMap {
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
    showmodal: ModalEvent<unknown>;
    hidemodal: ModalEvent<unknown>;
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
    resizetablecolumn: TableEvent;
    movetablecolumn: TableEvent;
    movetablerow: TableEvent;
  }
}

export {};
