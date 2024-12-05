import { get, set, remove } from "./state";
import { EDIT_START_EVENT } from "@/constants/edit";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { TileType, ClientEntity, ClientTile } from "@/types/tiles";
import { showModal } from "./modals";

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
  tile: ClientEntity,
) {
  if (!isEditModeEnabled()) {
    throw new Error("Not in editing mode");
  }
  showModal(tileType, { tileId, tile });
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

function getPageId() {
  const pageId = document.body.dataset.pageId;
  if (!pageId) {
    throw new Error("No page ID found");
  }
  return pageId;
}

type UpdateTileInput = AppRouterInputs["tiles"]["update"];

export async function updateTile(id: string, tile: UpdateTileInput["tile"]) {
  const result = await client.tiles.update.mutate({ id, tile });
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}

type CreateImageInput = Omit<AppRouterInputs["images"]["create"], "pageId">;

export async function createImage(image: CreateImageInput) {
  const result = await client.images.create.mutate({
    pageId: getPageId(),
    ...image,
  });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateImageInput = AppRouterInputs["images"]["update"];

export async function updateImage(image: UpdateImageInput) {
  const result = await client.images.update.mutate(image);
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}

export async function updateTileData(tile: ClientTile) {
  window.dispatchEvent(new CustomEvent("tile:update", { detail: tile }));
}
