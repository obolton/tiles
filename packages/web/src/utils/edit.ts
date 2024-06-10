import {
  EDIT_START_EVENT,
  EDIT_END_EVENT,
  EDIT_TILE_START_EVENT,
  EDIT_TILE_END_EVENT,
  DELETE_TILE_EVENT,
} from "../constants/edit";
import type { TileType } from "../types/tiles";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    document.body.dataset.editing = "true";
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
  } else {
    delete document.body.dataset.editing;
    document.dispatchEvent(new CustomEvent(EDIT_END_EVENT));
  }
}

export function editTile(tileId: string, tileType: TileType) {
  if (!document.body.hasAttribute("data-editing")) {
    throw new Error("Not in editing mode");
  }
  document.dispatchEvent(
    new CustomEvent(EDIT_TILE_START_EVENT, { detail: { tileId, tileType } })
  );
}

export function createTile(tileType: TileType) {
  if (!document.body.hasAttribute("data-editing")) {
    throw new Error("Not in editing mode");
  }
  document.dispatchEvent(
    new CustomEvent(EDIT_TILE_START_EVENT, {
      detail: { tileId: null, tileType },
    })
  );
}

export function finishEditingTile() {
  document.dispatchEvent(new CustomEvent(EDIT_TILE_END_EVENT));
}

export function deleteTile(id: string) {
  window.dispatchEvent(new CustomEvent(DELETE_TILE_EVENT, { detail: { id } }));
}
