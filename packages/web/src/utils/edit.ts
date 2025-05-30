import { get, set, remove } from "./state";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    set("edit", window.location.pathname);
    document.body.dataset.editing = "true";
  } else {
    remove("edit");
    delete document.body.dataset.editing;
  }
}

export function isEditMode() {
  if (import.meta.env.SSR) {
    return false;
  }
  const pathname = get("edit");
  return !!pathname && window.location.pathname === pathname;
}
