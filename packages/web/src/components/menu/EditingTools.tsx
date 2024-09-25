import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import moreIcon from "@/icons/more.svg";
import trashIcon from "@/icons/trash.svg";
import { redirectWithToast } from "@/utils/toasts";
import client from "@/api/client";

interface EditingToolsProps {
  pageId: string;
  allowDelete: boolean;
}

export default function EditingTools({
  pageId,
  allowDelete,
}: EditingToolsProps) {
  const isEditable = useEditable();

  const deletePage = useCallback(async () => {
    await client.pages.delete.mutate({ id: pageId });
    redirectWithToast("/", "The page was deleted.", "success");
  }, [pageId]);

  if (!isEditable) {
    return null;
  }

  return (
    <>
      <hr />
      <TileButtons />
      <hr />
      <FormattingTools pageId={pageId} />
      <hr />
      <button
        id="page-options-button"
        type="button"
        className="floating"
        role="menuitem"
        // @ts-expect-error React is not yet aware of popovertarget
        popovertarget="page-options"
        aria-label="More options"
        aria-haspopup="menu"
      >
        <img src={moreIcon.src} alt="More options" aria-hidden="true" />
      </button>
      <popover-menu
        id="page-options"
        anchor="page-options-button"
        align="right"
      >
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
