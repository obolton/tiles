import { EDIT_START_EVENT, EDIT_END_EVENT } from "../constants/edit";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    document.body.dataset.editing = "true";
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
  } else {
    delete document.body.dataset.editing;
    document.dispatchEvent(new CustomEvent(EDIT_END_EVENT));
  }
}
