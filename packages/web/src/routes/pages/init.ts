import { setEditMode } from "@/utils/edit";
import { hydrateRoute } from "@/utils/hydration";
import { isSignedIn } from "@/utils/sessions";
import { initialize as initializeLightbox } from "@/utils/lightbox";
import { startPresentation } from "@/presentation";
import { handleError } from "@/utils/errors";

const url = new URL(window.location.href);
const editParam = url.searchParams.get("edit");
const versionParam = url.searchParams.get("version");
const presentParam = url.searchParams.get("present");

if (editParam) {
  url.searchParams.delete("edit");
  history.replaceState(null, "", url);
}

if (presentParam !== null) {
  // Presenting always leaves edit mode, as the Present button and shortcut do
  setEditMode(false);
} else if (
  !versionParam &&
  (editParam || sessionStorage.getItem("edit") === window.location.pathname)
) {
  setEditMode(true);
}

initializeLightbox();

if (isSignedIn()) {
  await hydrateRoute().catch(handleError);
}

if (presentParam !== null) {
  startPresentation(parseInt(presentParam, 10) || 0).catch(handleError);
}
