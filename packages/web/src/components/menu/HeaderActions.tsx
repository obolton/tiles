import EditingTools from "./EditingTools";
import CollaboratorList from "@/components/collaboration/CollaboratorList";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import BookmarkFilledIcon from "@/icons/bookmark-filled.svg?jsx";
import PresentIcon from "@/icons/present.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import If from "jsx/if";
import { startPresentation } from "@/presentation";
import { viewTransition } from "@/utils/transitions";
import { isBookmarked, setIsBookmarked } from "@/utils/bookmarks";
import { handleError } from "@/utils/errors";
import styles from "./HeaderActions.module.css";
import type Editor from "@/editor/Editor";

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

export default function HeaderActions({ editor }: HeaderActionsProps) {
  const { isEditable } = editor;
  function toggleEdit() {
    viewTransition(() => {
      editor.setEditable(!isEditable.value);
    });
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
              <EditingTools editor={editor} />
            </If>
          </ToolbarGroup>

          <ToolbarGroup label="Page actions">
            <ToolbarButton
              label={isBookmarked.derive((value) => (value ? "Bookmarked" : "Not bookmarked"))}
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
                editor.setEditable(false);
                void startPresentation();
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
      )}
    </>
  );
}
