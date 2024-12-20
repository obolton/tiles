import { useCallback, useState } from "react";
import useEditable from "@/hooks/useEditable";
import TileButtons from "./TileButtons";
import FormattingTools from "./FormattingTools";
import privateIcon from "@/icons/private.svg";
import publicIcon from "@/icons/public.svg";
import moreIcon from "@/icons/more.svg";
import trashIcon from "@/icons/trash.svg";
import { redirectWithToast, showToast } from "@/utils/toasts";
import client from "@/api/client";

interface EditingToolsProps {
  pageId: string;
  isPublished: boolean;
  allowPublish: boolean;
  allowDelete: boolean;
}

export default function EditingTools({
  pageId,
  isPublished: initialIsPublished,
  allowPublish,
  allowDelete,
}: EditingToolsProps) {
  const isEditable = useEditable();
  const [isPublished, setIsPublished] = useState(initialIsPublished);

  const publishPage = useCallback(async () => {
    await client.pages.update.mutate({ pageId, published: true });
    setIsPublished(true);
    showToast("The page was published.", "success");
  }, [pageId]);

  const unpublishPage = useCallback(async () => {
    await client.pages.update.mutate({ pageId, published: false });
    setIsPublished(false);
    showToast("The page was unpublished.", "success");
  }, [pageId]);

  const deletePage = useCallback(async () => {
    await client.pages.delete.mutate({ pageId });
    redirectWithToast("/library", "The page was deleted.", "success");
  }, [pageId]);

  if (!isEditable) {
    return null;
  }

  return (
    <>
      <hr />
      {isPublished ? (
        <button
          id="unpublish"
          className="floating tooltip-left"
          aria-label="Published"
          disabled={allowPublish ? undefined : true}
          onClick={unpublishPage}
        >
          <img className="icon" src={publicIcon.src} alt="Published" />
        </button>
      ) : (
        <button
          id="publish"
          className="floating tooltip-left"
          aria-label="Private"
          disabled={allowPublish ? undefined : true}
          onClick={publishPage}
        >
          <img className="icon" src={privateIcon.src} alt="Private" />
        </button>
      )}
      <hr />
      <TileButtons />
      <hr />
      <FormattingTools pageId={pageId} />
      <hr />
      <button
        id="page-options-button"
        type="button"
        className="floating tooltip-left"
        role="menuitem"
        popoverTarget="page-options"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded="false"
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
