import { handleError } from "@/utils/errors";
import { isSignedIn } from "@/utils/sessions";
import { getIsBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { setEditMode } from "@/utils/edit";
import { sharePage } from "@/utils/sharing";
import { showToast } from "@/utils/toasts";
import bookmarkIcon from "@/icons/bookmark.svg";
import bookmarkFilledIcon from "@/icons/bookmark-filled.svg";

const PAGE_ID = document.body.dataset.pageId || "";
if (!PAGE_ID) {
  throw new Error("Page ID is not defined");
}

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
  const editSwitch = document.getElementById("edit-switch") as HTMLInputElement;

  if (isEditing) {
    document.body.dataset.editing = "true";
    editSwitch.checked = true;
  } else {
    editSwitch.addEventListener("change", () => setEditMode(true), {
      passive: true,
      once: true,
    });
  }

  document.getElementById("share")?.addEventListener("click", sharePage);

  const bookmark = document.getElementById("bookmark") as HTMLButtonElement;
  if (isSignedIn() && bookmark) {
    getIsBookmarked(PAGE_ID).then((bookmarked) =>
      updateBookmarkButton(bookmarked),
    );
    bookmark.addEventListener("click", updateBookmark, { passive: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDOMContentLoaded, {
    once: true,
  });
} else {
  onDOMContentLoaded();
}

function updateBookmarkButton(isBookmarked: boolean) {
  const button = document.getElementById("bookmark") as HTMLButtonElement;
  const image = button.firstElementChild as HTMLImageElement;
  button.ariaPressed = isBookmarked ? "true" : "false";
  image.src = isBookmarked ? bookmarkFilledIcon.src : bookmarkIcon.src;
}

async function updateBookmark() {
  const bookmark = document.getElementById("bookmark") as HTMLButtonElement;
  const isBookmarked = bookmark.ariaPressed === "true";
  bookmark.classList.add("pending");
  updateBookmarkButton(!isBookmarked);
  try {
    await setIsBookmarked(PAGE_ID, !isBookmarked);
    showToast(
      isBookmarked ? "The bookmark was removed." : "The page was bookmarked.",
      "success",
    );
  } catch (error) {
    handleError(error);
    updateBookmarkButton(isBookmarked);
  } finally {
    bookmark.classList.remove("pending");
  }
}
