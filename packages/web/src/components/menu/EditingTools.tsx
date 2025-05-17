import CollaborationButtons from "./CollaborationButtons";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import type Editor from "@/editor/Editor";
import { redirectWithToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import type { StoreInterface } from "@/utils/reactivity";

interface EditingToolsProps {
  editor: Editor;
  isPublished: StoreInterface<boolean>;
  allowPublish: boolean;
  allowDelete: boolean;
}

export default function EditingTools({
  editor,
  isPublished,
  allowPublish,
  allowDelete,
}: EditingToolsProps) {
  const deletePage = async () => {
    try {
      await editor.deletePage();
      redirectWithToast("/library/trash", "The page was deleted.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <>
      <CollaborationButtons
        editor={editor}
        isPublished={isPublished}
        allowPublish={allowPublish}
      />

      <TileButtons editor={editor} />

      <FormattingTools editor={editor} />

      <ul role="group" aria-label="More tools">
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
                  onclick={deletePage}
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
