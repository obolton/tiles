import { setEditMode } from "@/utils/edit";
import { hydrateRoute } from "@/utils/hydration";
import { isSignedIn } from "@/utils/sessions";
import { initialize as initializeLightbox } from "@/utils/lightbox";
import { handleError } from "@/utils/errors";

const url = new URL(window.location.href);
const editParam = url.searchParams.get("edit");

if (editParam) {
  url.searchParams.delete("edit");
  history.replaceState(null, "", url);
}

if (editParam || sessionStorage.getItem("edit") === window.location.pathname) {
  setEditMode(true);
}

initializeLightbox();

if (isSignedIn()) {
  hydrateRoute().catch(handleError);
}
