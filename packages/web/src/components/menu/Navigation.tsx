import LibraryIcon from "@/icons/library.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import SignOutIcon from "@/icons/sign-out.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import BookmarkFilledIcon from "@/icons/bookmark-filled.svg?jsx";
import ShareIcon from "@/icons/share.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import { user } from "@/utils/sessions";
import { isSignedIn, getUserInfo, getCachedUserInfo } from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import client from "@/api/client";
import { signOut } from "@/utils/sessions";
import { getIsBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { flag } from "@/utils/reactivity";
import { showToast } from "@/utils/toasts";
import { sharePage } from "@/utils/sharing";

export interface NavigationProps {
  workspaceId: string;
  showBookmark?: boolean;
  showTableOfContents?: boolean;
  showShare?: boolean;
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
  workspaceId,
  showBookmark = false,
  showTableOfContents = false,
  showShare = false,
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
            <button
              type="button"
              id="account-button"
              className="floating"
              popoverTarget="account-menu"
              data-tooltip={`Signed in as ${value.name}`}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <img
                className="profile-image"
                src={value.imageUrl}
                alt={value.name}
              />
            </button>
            <popover-menu id="account-menu" anchor="account-button">
              <menu>
                {value.workspaces.map((workspace) => (
                  <li>
                    <a href={`/workspaces/${workspace.id}`} target="_blank">
                      <WorkspaceIcon aria-hidden="true" />
                      {workspace.name}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/settings">
                    <SettingsIcon aria-hidden="true" />
                    Settings
                  </a>
                </li>
                <li>
                  <button type="button" on:click={signOut}>
                    <SignOutIcon aria-hidden="true" />
                    Sign out
                  </button>
                </li>
              </menu>
            </popover-menu>
          </li>
          <li>
            <a
              href={`/workspaces/${workspaceId}`}
              className="floating"
              data-tooltip="Your library"
            >
              <LibraryIcon aria-hidden="true" />
            </a>
          </li>
          <li>
            <button
              type="button"
              className="floating"
              data-tooltip="Create a new page"
              data-pending-text=""
              on:click={createNewPage}
            >
              <NewIcon aria-hidden="true" />
            </button>
          </li>

          {showBookmark ? (
            <li>
              <button
                type="button"
                classList={{
                  floating: true,
                  pending: bookmarkPending,
                }}
                aria-label={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                data-tooltip={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                aria-pressed={isBookmarked.derive((value) =>
                  value ? "true" : "false",
                )}
                on:click={onClickBookmark}
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

          {showShare ? (
            <li>
              <button
                type="button"
                className="floating"
                aria-label="Share this page"
                data-tooltip="Share this page"
                on:click={sharePage}
              >
                <ShareIcon aria-hidden="true" />
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    ) : null,
  );
}
