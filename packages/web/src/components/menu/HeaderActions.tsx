import EditingTools from "./EditingTools";
import CollaboratorList from "@/components/collaboration/CollaboratorList";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import BookmarkFilledIcon from "@/icons/bookmark-filled.svg?jsx";
import PresentIcon from "@/icons/present.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import ShareIcon from "@/icons/share.svg?jsx";
import HistoryIcon from "@/icons/history.svg?jsx";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import If from "jsx/if";
import { startPresentation } from "@/presentation";
import { viewTransition } from "@/utils/transitions";
import { isBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { handleError } from "@/utils/errors";
import { mediaQuery } from "@/utils/viewport";
import { PAGE_ACTIONS_BUTTON_ID } from "@/components/pages/SidebarPanel";
import styles from "./HeaderActions.module.css";
import type Editor from "@/editor/Editor";

const PAGE_ACTIONS_MENU_ID = "page-actions-menu";

/** Below this width the secondary actions collapse into an overflow menu. */
const COMPACT_ACTIONS_QUERY = "(width < 1024px)";

/** Below this width undo and redo join the overflow menu. */
const PHONE_QUERY = "(width < 640px)";

export interface HeaderActionsProps {
  editor: Editor;
}

async function onClickBookmark() {
  const pageId = document.body.dataset.pageId;
  if (!pageId) {
    return;
  }

  try {
    isBookmarked.toggle();
    await setIsBookmarked(pageId, isBookmarked.value);
  } catch (error) {
    handleError(error);
  }
}

function bookmarkIcon(bookmarked: boolean) {
  return bookmarked ? (
    <BookmarkFilledIcon aria-hidden="true" />
  ) : (
    <BookmarkIcon aria-hidden="true" />
  );
}

export default function HeaderActions({ editor }: HeaderActionsProps) {
  const { isEditable, canUndo, canRedo } = editor;
  const isCompact = mediaQuery(COMPACT_ACTIONS_QUERY);
  const isExpanded = isCompact.derive((compact) => !compact);
  const isPhone = mediaQuery(PHONE_QUERY);
  const showUndoRedo = isPhone.derive((phone) => !phone);

  function toggleEdit() {
    viewTransition(() => {
      editor.setEditable(!isEditable.value);
    });
  }

  function present() {
    editor.setEditable(false);
    void startPresentation();
  }

  /** Runs a menu item's action once the overflow menu has closed. */
  function menuAction(action: () => void) {
    return () => {
      document.getElementById(PAGE_ACTIONS_MENU_ID)?.hidePopover();
      action();
    };
  }

  return (
    <>
      {editor.isCollaborating.derive(() =>
        editor.collaboration ? (
          <CollaboratorList presence={editor.collaboration.presence} editor={editor} />
        ) : null,
      )}

      {editor.isPreviewing ? null : (
        <>
          <ToolbarGroup label="Editing" className={styles.editing}>
            <button
              type="button"
              id="edit-button"
              className="primary"
              aria-pressed={isEditable}
              on:click={toggleEdit}
            >
              {isEditable.derive((editable) => (editable ? "Done" : "Edit"))}
            </button>

            <If condition={isEditable}>
              <EditingTools editor={editor} undoRedo={showUndoRedo} panels={isExpanded} />
            </If>
          </ToolbarGroup>

          <ToolbarGroup label="Page actions">
            <If condition={isExpanded}>
              <ToolbarButton
                label={isBookmarked.derive((value) => (value ? "Bookmarked" : "Not bookmarked"))}
                aria-pressed={isBookmarked}
                on:click={onClickBookmark}
              >
                {isBookmarked.derive(bookmarkIcon)}
              </ToolbarButton>

              <ToolbarButton label="Present" on:click={present}>
                <PresentIcon aria-hidden="true" />
              </ToolbarButton>
            </If>

            <If condition={isCompact}>
              <ToolbarButton
                id={PAGE_ACTIONS_BUTTON_ID}
                label="More actions"
                popovertarget={PAGE_ACTIONS_MENU_ID}
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <MoreIcon aria-hidden="true" />
              </ToolbarButton>

              <popover-menu id={PAGE_ACTIONS_MENU_ID} align="right">
                <If condition={isEditable}>
                  <If condition={isPhone}>
                    <MenuItemGroup>
                      <MenuItem
                        icon={<UndoIcon aria-hidden="true" />}
                        aria-disabled={canUndo.derive((v) => (v ? undefined : "true"))}
                        on:click={menuAction(() => editor.undo())}
                      >
                        Undo
                      </MenuItem>
                      <MenuItem
                        icon={<RedoIcon aria-hidden="true" />}
                        aria-disabled={canRedo.derive((v) => (v ? undefined : "true"))}
                        on:click={menuAction(() => editor.redo())}
                      >
                        Redo
                      </MenuItem>
                    </MenuItemGroup>
                  </If>

                  <MenuItemGroup>
                    <MenuItem
                      icon={<ShareIcon aria-hidden="true" />}
                      checked={editor.share.isOpen}
                      on:click={menuAction(() => editor.share.toggle())}
                    >
                      Share
                    </MenuItem>
                    <MenuItem
                      icon={<HistoryIcon aria-hidden="true" />}
                      checked={editor.versionHistory.isOpen}
                      on:click={menuAction(() => editor.versionHistory.toggle())}
                    >
                      Version history
                    </MenuItem>
                  </MenuItemGroup>
                </If>

                <MenuItemGroup>
                  <MenuItem
                    icon={isBookmarked.derive(bookmarkIcon)}
                    checked={isBookmarked}
                    on:click={menuAction(() => void onClickBookmark())}
                  >
                    Bookmark
                  </MenuItem>
                  <MenuItem
                    icon={<PresentIcon aria-hidden="true" />}
                    on:click={menuAction(present)}
                  >
                    Present
                  </MenuItem>
                </MenuItemGroup>
              </popover-menu>
            </If>
          </ToolbarGroup>
        </>
      )}
    </>
  );
}
