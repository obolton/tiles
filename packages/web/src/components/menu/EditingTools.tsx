import { useCallback, useState } from "react";
import useEditable from "@/hooks/useEditable";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import privateIcon from "@/icons/private.svg";
import publicIcon from "@/icons/public.svg";
import moreIcon from "@/icons/more.svg";
import trashIcon from "@/icons/trash.svg";
import { redirectWithToast, showToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";

interface EditingToolsProps {
  isPublished: boolean;
  allowPublish: boolean;
  allowDelete: boolean;
}

export default function EditingTools({
  isPublished: initialIsPublished,
  allowPublish,
  allowDelete,
}: EditingToolsProps) {
  const editor = useEditor();
  const isEditable = useEditable();
  const [isPublished, setIsPublished] = useState(initialIsPublished);

  const publishPage = useCallback(async () => {
    try {
      await editor.setPublished(true);
      setIsPublished(true);
      showToast("The page was published.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  const unpublishPage = useCallback(async () => {
    try {
      await editor.setPublished(false);
      setIsPublished(false);
      showToast("The page was unpublished.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  const deletePage = useCallback(async () => {
    try {
      await editor.deletePage();
      redirectWithToast("/library", "The page was deleted.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  if (!isEditable) {
    return null;
  }

  return (
    <>
      <hr />
      {isPublished ? (
        <button
          id="unpublish"
          className="floating"
          aria-label="Published"
          data-tooltip="This page is published"
          disabled={allowPublish ? undefined : true}
          onClick={unpublishPage}
        >
          <img className="icon" src={publicIcon.src} alt="Published" />
        </button>
      ) : (
        <button
          id="publish"
          className="floating"
          aria-label="Private"
          data-tooltip="This page is private"
          disabled={allowPublish ? undefined : true}
          onClick={publishPage}
        >
          <img className="icon" src={privateIcon.src} alt="Private" />
        </button>
      )}
      <hr />
      <TileButtons />
      <hr />
      <FormattingTools />
      <hr />
      <button
        id="page-options-button"
        type="button"
        className="floating"
        role="menuitem"
        popoverTarget="page-options"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded="false"
        data-tooltip="More options"
      >
        <img src={moreIcon.src} alt="More options" aria-hidden="true" />
      </button>
      <popover-menu id="page-options" anchor="page-options-button">
        <menu>
          <li>
            <button
              className="destructive"
              type="button"
              disabled={allowDelete ? undefined : true}
              onClick={deletePage}
            >
              <img
                className="icon"
                src={trashIcon.src}
                alt="Delete"
                aria-hidden="true"
              />
              Delete page
            </button>
          </li>
        </menu>
      </popover-menu>
    </>
  );
}
