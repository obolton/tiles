import { setEditMode, isEditMode } from "@/utils/edit";
import { hydrateRoute } from "@/utils/hydration";
import { isSignedIn } from "@/utils/sessions";
import { sharePage } from "@/utils/sharing";
import { initialize as initializeLightbox } from "@/utils/lightbox";
import { handleError } from "@/utils/errors";

const url = new URL(window.location.href);
const editSearchParam = url.searchParams.get("edit");

if (editSearchParam) {
  url.searchParams.delete("edit");
  sessionStorage.setItem("edit", JSON.stringify(url.pathname));
  history.replaceState(null, "", url);
}

const shouldEnterEditMode = isEditMode() || editSearchParam;

async function hydrate() {
  try {
    await hydrateRoute();
  } catch (error) {
    handleError(error);
  }
}

function enterEditMode() {
  setEditMode(true);
  document.body.dataset.editing = "true";
  document.getElementById("edit-button")?.setAttribute("aria-pressed", "true");
}

function initialize() {
  // If user is signed in, hydrate to enable the interactive experience
  // (including rendering the edit button)
  if (isSignedIn()) {
    if (shouldEnterEditMode) {
      enterEditMode();
    }
    hydrate();
  }

  document.getElementById("share")?.addEventListener("click", sharePage);
  initializeLightbox();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
