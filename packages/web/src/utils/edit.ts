import { get, set, remove } from "./state";
import { EDIT_START_EVENT } from "@/constants/edit";
import { viewTransition } from "@/utils/transitions";

export function setEditMode(isEditing: boolean) {
  viewTransition(() => {
    if (isEditing) {
      set("edit", window.location.pathname);
      document.body.dataset.editing = "true";
      document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
    } else {
      remove("edit");
      delete document.body.dataset.editing;
    }
  });
}

export function isEditModeEnabled() {
  return get<string>("edit") === window.location.pathname;
}
