import { useCallback } from "react";
import CollaborationButtons from "./CollaborationButtons";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
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

  const deletePage = useCallback(async () => {
    try {
      await editor.deletePage();
      redirectWithToast("/library", "The page was deleted.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  return (
    <>
      <CollaborationButtons
        isPublished={isPublished}
        allowPublish={allowPublish}
      />

      <TileButtons />

      <FormattingTools />

      <ul role="group">
        <li role="presentation">
          <button
            id="page-options-button"
            type="button"
            className="floating small"
            role="menuitem"
            popoverTarget="page-options"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded="false"
            data-tooltip="More options"
          >
            <MoreIcon aria-hidden="true" />
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
                  <TrashIcon aria-hidden="true" />
                  Delete page
                </button>
              </li>
            </menu>
          </popover-menu>
        </li>
      </ul>
    </>
  );
}
