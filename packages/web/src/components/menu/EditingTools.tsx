import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import CollaborationButtons from "./CollaborationButtons";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import moreIcon from "@/icons/more.svg";
import trashIcon from "@/icons/trash.svg";
import { redirectWithToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";

interface EditingToolsProps {
  isPublished: boolean;
  allowPublish: boolean;
  allowDelete: boolean;
}

export default function EditingTools({
  isPublished,
  allowPublish,
  allowDelete,
}: EditingToolsProps) {
  const editor = useEditor();
  const isEditable = useEditable();

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
      <CollaborationButtons
        isPublished={isPublished}
        allowPublish={allowPublish}
      />
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
