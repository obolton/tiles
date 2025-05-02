import { get, set, remove } from "./state";
import { EDIT_START_EVENT } from "@/constants/edit";

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

export function isEditMode() {
  if (import.meta.env.SSR || typeof window === "undefined") {
    return false;
  }
  const pathname = get("edit");
  return !!pathname && window.location.pathname === pathname;
}
