import { get, set, remove } from "./state";
import { EDIT_START_EVENT } from "@/constants/edit";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { TileType, ClientEntity, ClientTile } from "@/types/tiles";
import { showModal } from "./modals";
import { preloadImage } from "./media";

type CreateImageInput = Omit<AppRouterInputs["images"]["create"], "pageId">;
type CreateMapInput = Omit<AppRouterInputs["maps"]["create"], "pageId">;
type CreateTextInput = Omit<AppRouterInputs["text"]["create"], "pageId">;
type CreateEventInput = Omit<AppRouterInputs["events"]["create"], "pageId">;
type CreateLinkInput = Omit<
  AppRouterInputs["externalLinks"]["create"],
  "pageId"
>;
type CreatePageLinkInput = Omit<
  AppRouterInputs["pageLinks"]["create"],
  "pageId"
>;
type CreateCollectionInput = Omit<
  AppRouterInputs["collections"]["create"],
  "pageId"
>;

type UpdateImageInput = Omit<AppRouterInputs["images"]["update"], "pageId">;
type UpdateTextInput = Omit<AppRouterInputs["text"]["update"], "pageId">;
type UpdateEventInput = Omit<AppRouterInputs["events"]["update"], "pageId">;
type UpdateLinkInput = Omit<
  AppRouterInputs["externalLinks"]["update"],
  "pageId"
>;
type UpdateVideoInput = Omit<AppRouterInputs["videos"]["update"], "pageId">;
type AddPlaceInput = Omit<AppRouterInputs["maps"]["addPlace"], "pageId">;
type UpdatePlaceInput = Omit<AppRouterInputs["maps"]["updatePlace"], "pageId">;
type RemovePlaceInput = Omit<AppRouterInputs["maps"]["removePlace"], "pageId">;

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

function getPageId() {
  const pageId = document.body.dataset.pageId;
  if (!pageId) {
    throw new Error("No page ID found");
  }
  return pageId;
}

export function createTileState(data: ClientTile) {
  window.dispatchEvent(new CustomEvent("tile:create", { detail: data }));
}

export async function createImage(data: CreateImageInput) {
  const result = await client.images.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  await preloadImage(result.imageUrl);
  createTileState(result);
}

export async function createMap(data: CreateMapInput) {
  const result = await client.maps.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  createTileState(result);
}

export async function createText(data: CreateTextInput) {
  const result = await client.text.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  createTileState(result);
}

export async function createEvent(data: CreateEventInput) {
  const result = await client.events.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  createTileState(result);
}

export async function createPageLink(data: CreatePageLinkInput) {
  const result = await client.pageLinks.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  createTileState(result);
}

export async function createLink(data: CreateLinkInput) {
  const result = await client.externalLinks.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  createTileState(result);
}

export async function createCollection(data: CreateCollectionInput) {
  const result = await client.collections.create.mutate({
    pageId: getPageId(),
    ...data,
  });
  // @ts-expect-error FIX: This is overloaded to both create and update
  createTileState(result);
}

export function updateTileState(
  data: Omit<ClientTile, "placementId" | "rows" | "columns" | "position">,
) {
  window.dispatchEvent(new CustomEvent("tile:update", { detail: data }));
}

export async function updateImage(data: UpdateImageInput) {
  const result = await client.images.update.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function updateText(data: UpdateTextInput) {
  const result = await client.text.update.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function updateEvent(data: UpdateEventInput) {
  const result = await client.events.update.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function updateLink(data: UpdateLinkInput) {
  const result = await client.externalLinks.update.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function updateVideo(data: UpdateVideoInput) {
  const result = await client.videos.update.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function addPlace(data: AddPlaceInput) {
  const result = await client.maps.addPlace.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function updatePlace(data: UpdatePlaceInput) {
  const result = await client.maps.updatePlace.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}

export async function removePlace(data: RemovePlaceInput) {
  const result = await client.maps.removePlace.mutate({
    pageId: getPageId(),
    ...data,
  });
  updateTileState(result);
}
