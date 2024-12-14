import { handleError } from "@/utils/errors";
import { isSignedIn } from "@/utils/sessions";
import { getIsBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { showToast } from "@/utils/toasts";
import bookmarkIcon from "@/icons/bookmark.svg";
import bookmarkFilledIcon from "@/icons/bookmark-filled.svg";

const PAGE_ID = document.body.dataset.pageId;
if (!PAGE_ID) {
  throw new Error("Page ID is not defined");
}

function updateBookmarkButton(isBookmarked: boolean) {
  const button = document.getElementById("bookmark") as HTMLButtonElement;
  const image = button.firstElementChild as HTMLImageElement;
  button.ariaPressed = isBookmarked ? "true" : "false";
  button.ariaLabel = isBookmarked ? "Remove bookmark" : "Add bookmark";
  image.src = isBookmarked ? bookmarkFilledIcon.src : bookmarkIcon.src;
}

const bookmark = document.getElementById("bookmark") as HTMLButtonElement;
if (isSignedIn() && bookmark) {
  updateBookmarkButton(await getIsBookmarked(PAGE_ID));
  bookmark.addEventListener(
    "click",
    async () => {
      const isBookmarked = bookmark.ariaPressed === "true";
      bookmark.classList.add("pending");
      updateBookmarkButton(!isBookmarked);
      try {
        await setIsBookmarked(PAGE_ID, !isBookmarked);
        showToast(
          isBookmarked ? "A bookmark was removed." : "A bookmark was added.",
          "success",
        );
      } catch (error) {
        handleError(error);
        updateBookmarkButton(isBookmarked);
      } finally {
        bookmark.classList.remove("pending");
      }
    },
    { passive: true },
  );
}
