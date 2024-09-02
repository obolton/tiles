import { get, set, remove } from "./state";
import { EDIT_START_EVENT, DELETE_TILE_EVENT } from "@/constants/edit";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { TileType, ClientEntity } from "@/types/tiles";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    set("edit", window.location.pathname);
    document.body.dataset.editing = "true";
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
  } else {
    remove("edit");
    delete document.body.dataset.editing;
  }
}

export function isEditModeEnabled() {
  return get<string>("edit") === window.location.pathname;
}

export function editTile(
  tileId: string,
  tileType: TileType,
  data: ClientEntity,
) {
  if (!isEditModeEnabled()) {
    throw new Error("Not in editing mode");
  }
  set("editTileId", tileId);
  set("editTileType", tileType);
  set("editTileData", data);
}

export function openCreateTileModal(tileType: TileType) {
  if (!isEditModeEnabled()) {
    throw new Error("Not in editing mode");
  }
  set("editTileType", tileType);
  remove("editTileId");
  remove("editTileData");
}

export function finishEditingTile() {
  remove("editTileType");
  remove("editTileId");
  remove("editTileData");
}

export function deleteTile(id: string) {
  window.dispatchEvent(new CustomEvent(DELETE_TILE_EVENT, { detail: { id } }));
}

type CreateTileInput = AppRouterInputs["tiles"]["create"];

export async function createTile(tile: CreateTileInput["tile"]) {
  const pageId = document.body.dataset.pageId;
  if (!pageId) {
    throw new Error("No page ID found");
  }
  const result = await client.tiles.create.mutate({ pageId, tile });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateTileInput = AppRouterInputs["tiles"]["update"];

export async function updateTile(id: string, tile: UpdateTileInput["tile"]) {
  const result = await client.tiles.update.mutate({ id, tile });
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}
