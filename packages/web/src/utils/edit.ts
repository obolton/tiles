import { get, set, remove } from "./state";
import { EDIT_START_EVENT, DELETE_TILE_EVENT } from "../constants/edit";
import type { TileType } from "../types/tiles";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    set("edit", true);
    document.body.dataset.editing = "true";
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
  } else {
    remove("edit");
    delete document.body.dataset.editing;
  }
}

export function isEditModeEnabled() {
  return get<boolean>("edit");
}

export function editTile(tileId: string, tileType: TileType) {
  if (!isEditModeEnabled()) {
    throw new Error("Not in editing mode");
  }
  set("editTileId", tileId);
  set("editTileType", tileType);
}

export function openCreateTileModal(tileType: TileType) {
  if (!isEditModeEnabled()) {
    throw new Error("Not in editing mode");
  }
  set("editTileType", tileType);
  remove("editTileId");
}

export function finishEditingTile() {
  remove("editTileType");
  remove("editTileId");
}

export function deleteTile(id: string) {
  window.dispatchEvent(new CustomEvent(DELETE_TILE_EVENT, { detail: { id } }));
}
