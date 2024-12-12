import { handleError } from "@/utils/errors";
import { isSignedIn } from "@/utils/sessions";
import { getIsBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import bookmarkIcon from "@/icons/bookmark.svg";
import bookmarkFilledIcon from "@/icons/bookmark-filled.svg";

const PAGE_ID = document.body.dataset.pageId;
if (!PAGE_ID) {
  throw new Error("Page ID is not defined");
}

const bookmark = document.getElementById("bookmark") as HTMLButtonElement;
const bookmarkImage = bookmark?.firstElementChild as HTMLImageElement;
if (isSignedIn() && bookmark && bookmarkImage) {
  const isBookmarked = await getIsBookmarked(PAGE_ID);
  bookmarkImage.src = isBookmarked ? bookmarkFilledIcon.src : bookmarkIcon.src;
  bookmark.ariaPressed = isBookmarked ? "true" : "false";
  bookmark.ariaLabel = isBookmarked ? "Remove bookmark" : "Add bookmark";
  bookmark.addEventListener(
    "click",
    async () => {
      try {
        const isBookmarked = bookmark.ariaPressed === "false";
        bookmark.classList.add("pending");
        await setIsBookmarked(PAGE_ID, isBookmarked);
        bookmarkImage.src = isBookmarked
          ? bookmarkFilledIcon.src
          : bookmarkIcon.src;
        bookmark.ariaPressed = isBookmarked ? "true" : "false";
        bookmark.ariaLabel = isBookmarked ? "Remove bookmark" : "Add bookmark";
      } catch (error) {
        handleError(error);
      } finally {
        bookmark.classList.remove("pending");
      }
    },
    { passive: true },
  );
}
