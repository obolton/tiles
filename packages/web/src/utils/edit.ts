export function isEditMode() {
  if (import.meta.env.SSR) {
    return false;
  }
  return document.body.dataset.editing === "true";
}

export function setEditMode(isEditing: boolean) {
  if (isEditing) {
    sessionStorage.setItem("edit", window.location.pathname);
    document.body.dataset.editing = "true";
  } else {
    sessionStorage.removeItem("edit");
    delete document.body.dataset.editing;
  }
}
