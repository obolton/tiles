import { get, set, remove } from "./state";
import { EDIT_START_EVENT, DELETE_TILE_EVENT } from "@/constants/edit";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { TileType } from "@/types/tiles";

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

type CreateTileInput = AppRouterInputs["tiles"]["create"];

export async function createTile(input: CreateTileInput) {
  const result = await client.tiles.create.mutate(input);
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateTileInput = AppRouterInputs["tiles"]["update"];

export async function updateTile(input: UpdateTileInput) {
  const result = await client.tiles.update.mutate(input);
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}
