import { useSyncExternalStore } from "react";
import { EDIT_START_EVENT, EDIT_END_EVENT } from "../constants/edit";

function subscribe(callback: () => void) {
  document.addEventListener(EDIT_START_EVENT, callback);
  document.addEventListener(EDIT_END_EVENT, callback);

  return () => {
    document.removeEventListener(EDIT_START_EVENT, callback);
    document.removeEventListener(EDIT_END_EVENT, callback);
  };
}

function getSnapshot() {
  return document.body.hasAttribute("data-editing");
}

function getServerSnapshot() {
  return false;
}

export default function useEditable() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
