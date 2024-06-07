import {
  EDIT_START_EVENT,
  EDIT_END_EVENT,
  EDIT_TILE_START_EVENT,
  EDIT_TILE_END_EVENT,
} from "../constants/edit";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    document.body.dataset.editing = "true";
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
  } else {
    delete document.body.dataset.editing;
    document.dispatchEvent(new CustomEvent(EDIT_END_EVENT));
  }
}

export function editTile(tileId: string) {
  if (!document.body.hasAttribute("data-editing")) {
    throw new Error("Not in editing mode");
  }
  document.body.setAttribute("data-edit-tile-id", tileId);
  document.dispatchEvent(new CustomEvent(EDIT_TILE_START_EVENT));
}

export function finishEditingTile() {
  document.body.removeAttribute("data-edit-tile-id");
  document.dispatchEvent(new CustomEvent(EDIT_TILE_END_EVENT));
}
