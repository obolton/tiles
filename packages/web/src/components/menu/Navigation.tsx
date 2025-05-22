import NewIcon from "@/icons/new.svg?jsx";
import LibraryIcon from "@/icons/library.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import SignOutIcon from "@/icons/sign-out.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import BookmarkFilledIcon from "@/icons/bookmark-filled.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import { user } from "@/utils/sessions";
import { isSignedIn, getUserInfo, getCachedUserInfo } from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import client from "@/api/client";
import { signOut } from "@/utils/sessions";
import { getIsBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { flag } from "@/utils/reactivity";
import { showToast } from "@/utils/toasts";

export interface NavigationProps {
  showBookmark?: boolean;
  showTableOfContents?: boolean;
}

async function createNewPage(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  button.classList.add("pending");
  try {
    const { id } = await client.pages.create.mutate({ title: "New page" });
    window.open(`/pages/${id}?edit=true`, "_blank");
  } catch (error) {
    handleError(error);
  } finally {
    button.classList.remove("pending");
  }
}

export default function Navigation({
  showBookmark = false,
  showTableOfContents = false,
}: NavigationProps) {
  const isBookmarked = flag(false);
  const bookmarkPending = flag(false);

  if (!import.meta.env.SSR) {
    queueMicrotask(() => {
      if (isSignedIn()) {
        document.body.dataset.signedIn = "true";
        const userInfo = getCachedUserInfo();

        if (!userInfo) {
          getUserInfo().catch((error) => handleError(error));
        } else {
          user.value = userInfo;
        }

        const pageId = document.body.dataset.pageId;
        if (pageId) {
          getIsBookmarked(pageId).then(
            (bookmarked) => (isBookmarked.value = bookmarked),
          );
        }
      }
    });
  }

  const onClickBookmark = async () => {
    const pageId = document.body.dataset.pageId;
    if (!pageId) {
      return;
    }

    try {
      isBookmarked.toggle();
      bookmarkPending.on();
      await setIsBookmarked(pageId, isBookmarked.value);
      showToast(
        isBookmarked.value
          ? "The page was bookmarked."
          : "The bookmark was removed.",
        "success",
      );
    } catch (error) {
      handleError(error);
    } finally {
      bookmarkPending.off();
    }
  };

  return user.derive((value) =>
    value ? (
      <nav
        id="navigation"
        aria-label="Main navigation links"
        data-tooltip-position="right"
      >
        <ul>
          <li>
            <a href={value.id} className="floating" data-tooltip="Your profile">
              <img
                className="profile-image"
                src={value.imageUrl}
                alt="Profile image"
              />
            </a>
          </li>
          <li>
            <a
              href="/library"
              className="floating"
              aria-label="Library"
              data-tooltip="Library"
            >
              <LibraryIcon aria-hidden="true" />
            </a>
          </li>
          <li>
            <button
              id="new-page-button"
              className="floating"
              type="button"
              data-tooltip="Create a new page"
              data-pending-text=""
              onclick={createNewPage}
            >
              <NewIcon aria-hidden="true" />
            </button>
          </li>
          <li>
            <button
              id="more-button"
              className="floating"
              type="button"
              role="menuitem"
              popoverTarget="navigation-overflow"
              data-tooltip="More options"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <SettingsIcon aria-hidden="true" />
            </button>
            <popover-menu id="navigation-overflow" anchor="more-button">
              <menu>
                <li>
                  <a href="/settings">
                    <SettingsIcon aria-hidden="true" />
                    Account settings
                  </a>
                </li>
                <li>
                  <button id="sign-out" type="button" onclick={signOut}>
                    <SignOutIcon aria-hidden="true" />
                    Sign out
                  </button>
                </li>
              </menu>
            </popover-menu>
          </li>

          {showBookmark ? (
            <li>
              <button
                classList={{
                  floating: true,
                  pending: bookmarkPending,
                }}
                type="button"
                role="menuitem"
                aria-label={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                data-tooltip={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                aria-pressed={isBookmarked.derive((value) =>
                  value ? "true" : "false",
                )}
                onclick={onClickBookmark}
              >
                {isBookmarked.derive((value) =>
                  value ? (
                    <BookmarkFilledIcon aria-hidden="true" />
                  ) : (
                    <BookmarkIcon aria-hidden="true" />
                  ),
                )}
              </button>
            </li>
          ) : null}

          {showTableOfContents ? (
            <li>
              <button
                id="toc-button"
                className="floating"
                type="button"
                role="menuitem"
                popoverTarget="toc"
                aria-label="Table of contents"
                data-tooltip="Table of contents"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <MenuIcon aria-hidden="true" />
              </button>
              <table-of-contents
                id="toc"
                anchor="toc-button"
                role="navigation"
              />
            </li>
          ) : null}
        </ul>
      </nav>
    ) : null,
  );
}
