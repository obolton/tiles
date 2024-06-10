import { useSyncExternalStore } from "react";
import { EDIT_TILE_START_EVENT, EDIT_TILE_END_EVENT } from "../constants/edit";
import type { TileType } from "../types/tiles";

type State = { tileId: string | null; tileType: TileType | null };

const SERVER_SNAPSHOT = { tileId: null, tileType: null };
let state: State = { tileId: null, tileType: null };

if (typeof window !== "undefined") {
  document.addEventListener(EDIT_TILE_START_EVENT, (event) => {
    const { tileType, tileId } = (
      event as CustomEvent<{ tileId: string | null; tileType: TileType }>
    ).detail;
    state = { tileId, tileType };
  });
  document.addEventListener(EDIT_TILE_END_EVENT, () => {
    state = { tileId: null, tileType: null };
  });
}

function subscribe(callback: () => void) {
  document.addEventListener(EDIT_TILE_START_EVENT, callback);
  document.addEventListener(EDIT_TILE_END_EVENT, callback);

  return () => {
    document.removeEventListener(EDIT_TILE_START_EVENT, callback);
    document.removeEventListener(EDIT_TILE_END_EVENT, callback);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export default function useEditTile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
