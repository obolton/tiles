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

type CreateMapInput = Omit<AppRouterInputs["maps"]["create"], "pageId">;

export async function createMap(map: CreateMapInput) {
  const result = await client.maps.create.mutate({
    pageId: getPageId(),
    ...map,
  });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type CreateTextInput = Omit<AppRouterInputs["text"]["create"], "pageId">;

export async function createText(text: CreateTextInput) {
  const result = await client.text.create.mutate({
    pageId: getPageId(),
    ...text,
  });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateTextInput = AppRouterInputs["text"]["update"];

export async function updateText(text: UpdateTextInput) {
  const result = await client.text.update.mutate(text);
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}

type CreateHeadingInput = Omit<AppRouterInputs["headings"]["create"], "pageId">;

export async function createHeading(heading: CreateHeadingInput) {
  const result = await client.headings.create.mutate({
    pageId: getPageId(),
    ...heading,
  });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateHeadingInput = AppRouterInputs["headings"]["update"];

export async function updateHeading(heading: UpdateHeadingInput) {
  const result = await client.headings.update.mutate(heading);
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}

type CreateEventInput = Omit<AppRouterInputs["events"]["create"], "pageId">;

export async function createEvent(event: CreateEventInput) {
  const result = await client.events.create.mutate({
    pageId: getPageId(),
    ...event,
  });
  window.dispatchEvent(new CustomEvent("tile:create", { detail: result }));
}

type UpdateEventInput = AppRouterInputs["events"]["update"];

export async function updateEvent(event: UpdateEventInput) {
  const result = await client.events.update.mutate(event);
  window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));
}

export async function updateTileData(tile: Partial<ClientTile>) {
  window.dispatchEvent(new CustomEvent("tile:update", { detail: tile }));
}
