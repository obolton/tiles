import Menu from "@/components/menus/Menu";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItemLink from "@/components/menus/MenuItemLink";
import LibraryIcon from "@/icons/library.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";
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
import { initializeCache, isCacheInitialized } from "@/utils/cache";
import { flag } from "@/utils/reactivity";
import { showToast } from "@/utils/toasts";
import { showModal } from "@/utils/modals";

const CreateWorkspaceModalLoader = () =>
  import("@/components/modals/workspaces/CreateWorkspaceModal");

export interface NavigationProps {
  workspaceId: string;
  showBookmark?: boolean;
  showTableOfContents?: boolean;
}

export default function Navigation({
  workspaceId,
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
          getUserInfo()
            .then((u) => {
              if (u.value && !isCacheInitialized()) {
                initializeCache(u.value.id, workspaceId);
              }
            })
            .catch((error) => handleError(error));
        } else {
          user.value = userInfo;
          if (!isCacheInitialized()) {
            initializeCache(userInfo.id, workspaceId);
          }
        }

        const pageId = document.body.dataset.pageId;
        if (pageId) {
          getIsBookmarked(pageId)
            .then((bookmarked) => (isBookmarked.value = bookmarked))
            .catch(handleError);
        }
      }
    });
  }

  function createWorkspace() {
    showModal(CreateWorkspaceModalLoader, {
      props: {},
      async onConfirm({ name }) {
        const { id } = await client.workspaces.create.mutate({ name });
        await getUserInfo();
        window.open(`/workspaces/${id}`, "_blank");
      },
    });
  }

  async function createNewPage(event: Event) {
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.add("pending");
    try {
      const { id } = await client.pages.create.mutate({
        workspaceId,
        title: "New page",
      });
      window.open(`/pages/${id}?edit=true`, "_blank");
    } catch (error) {
      handleError(error);
    } finally {
      button.classList.remove("pending");
    }
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
              className="floating large"
              popovertarget="account-menu"
              data-tooltip={`Signed in as ${value.name}`}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              {value.imageUrl ? (
                <img
                  className="profile-image"
                  src={value.imageUrl}
                  alt={value.name}
                />
              ) : (
                <span className="profile-image" aria-hidden="true">
                  {value.name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <popover-menu id="account-menu">
              <Menu>
                <MenuItemGroup>
                  {value.workspaces.map((workspace) => (
                    <MenuItemLink
                      icon={<WorkspaceIcon aria-hidden="true" />}
                      href={`/workspaces/${workspace.id}`}
                      target="_blank"
                      aria-current={workspace.id === workspaceId}
                    >
                      {workspace.name}
                    </MenuItemLink>
                  ))}
                  {value.workspaces.length < 5 ? (
                    <MenuItem
                      icon={<NewIcon aria-hidden="true" />}
                      on:click={createWorkspace}
                    >
                      Create workspace
                    </MenuItem>
                  ) : null}
                </MenuItemGroup>
                <MenuItemGroup>
                  <MenuItemLink
                    icon={<SettingsIcon aria-hidden="true" />}
                    href={`/workspaces/${workspaceId}/settings`}
                  >
                    Settings
                  </MenuItemLink>
                  <MenuItem
                    icon={<SignOutIcon aria-hidden="true" />}
                    on:click={signOut}
                  >
                    Sign out
                  </MenuItem>
                </MenuItemGroup>
              </Menu>
            </popover-menu>
          </li>
          <li>
            <a
              href={`/workspaces/${workspaceId}`}
              className="floating large"
              data-tooltip="Your library"
            >
              <LibraryIcon aria-hidden="true" />
            </a>
          </li>
          <li>
            <button
              type="button"
              className="floating large"
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
                  large: true,
                  pending: bookmarkPending,
                }}
                aria-label={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                data-tooltip={isBookmarked.derive((value) =>
                  value ? "Bookmarked" : "Not bookmarked",
                )}
                aria-pressed={isBookmarked}
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
                className="floating large"
                type="button"
                popovertarget="toc"
                aria-label="Table of contents"
                data-tooltip="Table of contents"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <MenuIcon aria-hidden="true" />
              </button>
              <table-of-contents id="toc" role="navigation" />
            </li>
          ) : null}
        </ul>
      </nav>
    ) : null,
  );
}
