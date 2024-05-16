import { EDIT_START_EVENT, EDIT_END_EVENT } from "../constants/edit";

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    document.dispatchEvent(new CustomEvent(EDIT_START_EVENT));
    document.body.dataset.editing = "true";
  } else {
    document.dispatchEvent(new CustomEvent(EDIT_END_EVENT));
    delete document.body.dataset.editing;
  }
}
