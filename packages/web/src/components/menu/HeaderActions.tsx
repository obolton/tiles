import EditingTools from "./EditingTools";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import BookmarkFilledIcon from "@/icons/bookmark-filled.svg?jsx";
import PresentIcon from "@/icons/present.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import If from "@/jsx/if";
import { startPresentation } from "@/presentation";
import { viewTransition } from "@/utils/transitions";
import { isBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { handleError } from "@/utils/errors";
import { flag } from "@/utils/reactivity";
import { showToast } from "@/utils/toasts";
import styles from "./HeaderActions.module.css";
import type Editor from "@/editor/Editor";

export interface HeaderActionsProps {
  editor: Editor;
}

export default function HeaderActions({ editor }: HeaderActionsProps) {
  const { isEditable } = editor;
  const bookmarkPending = flag(false);

  function toggleEdit() {
    viewTransition(() => {
      isEditable.value = !isEditable.value;
    });
  }

  async function onClickBookmark() {
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
  }

  return (
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
          <EditingTools editor={editor} />
        </If>
      </ToolbarGroup>

      <ToolbarGroup label="Page actions">
        <ToolbarButton
          label={isBookmarked.derive((value) =>
            value ? "Bookmarked" : "Not bookmarked",
          )}
          classList={{ pending: bookmarkPending }}
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
        </ToolbarButton>

        <ToolbarButton
          label="Present"
          on:click={() => {
            isEditable.value = false;
            startPresentation();
          }}
        >
          <PresentIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          id="toc-button"
          label="Table of contents"
          popovertarget="toc"
          aria-haspopup="menu"
        >
          <MenuIcon aria-hidden="true" />
        </ToolbarButton>
        <table-of-contents id="toc" role="navigation" />
      </ToolbarGroup>
    </>
  );
}
