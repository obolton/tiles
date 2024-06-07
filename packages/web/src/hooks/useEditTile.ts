import { useSyncExternalStore } from "react";
import { EDIT_TILE_START_EVENT, EDIT_TILE_END_EVENT } from "../constants/edit";

function subscribe(callback: () => void) {
  document.addEventListener(EDIT_TILE_START_EVENT, callback);
  document.addEventListener(EDIT_TILE_END_EVENT, callback);

  return () => {
    document.removeEventListener(EDIT_TILE_START_EVENT, callback);
    document.removeEventListener(EDIT_TILE_END_EVENT, callback);
  };
}

function getSnapshot() {
  return document.body.getAttribute("data-edit-tile-id");
}

function getServerSnapshot() {
  return null;
}

export default function useEditable() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
