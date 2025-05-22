import { setEditMode } from "@/utils/edit";
import { sharePage } from "@/utils/sharing";
import { initialize } from "@/utils/lightbox";

const url = new URL(window.location.href);
const editSearchParam = url.searchParams.get("edit");

const editPath = JSON.parse(sessionStorage.getItem("edit") ?? "null");
const isEditing = editPath === url.pathname || editSearchParam;

if (editSearchParam) {
  url.searchParams.delete("edit");
  sessionStorage.setItem("edit", JSON.stringify(url.pathname));
  history.replaceState(null, "", url);
}

function onDOMContentLoaded() {
  if (isEditing) {
    document.body.dataset.editing = "true";
    document
      .getElementById("edit-button")
      ?.setAttribute("aria-pressed", "true");
  } else {
    document
      .getElementById("edit-button")
      ?.addEventListener("click", () => setEditMode(true), {
        passive: true,
        once: true,
      });
  }

  document.getElementById("share")?.addEventListener("click", sharePage);

  initialize();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDOMContentLoaded, {
    once: true,
  });
} else {
  onDOMContentLoaded();
}
