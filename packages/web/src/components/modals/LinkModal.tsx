import { useCallback } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { createLink, updateLink, createPageLink } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import type { ClientLink, ClientPageLink } from "@/types/tiles";
import styles from "./LinkModal.module.css";
import type { ModalProps } from "@/utils/modals";
import useInputState from "@/hooks/useInputState";
import PagesGrid from "@/components/grid/PagesGrid";
import PageLinkTile from "@/components/tiles/PageLinkTile";

interface LinkModalProps extends ModalProps {
  tileId?: string | null;
  tile?: ClientLink | ClientPageLink | null;
}

export default function LinkModal({ tileId, close, tile }: LinkModalProps) {
  const [url, onChangeUrl] = useInputState(
    tile && "url" in tile ? tile.url : "",
  );

  const selectPage = useCallback(
    async (linkedPageId: string) => {
      try {
        await createPageLink({
          linkedPageId,
        });
      } catch (error) {
        handleError(error);
      }

      close();
    },
    [close],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!url) {
        return;
      }

      if (tileId) {
        await updateLink({
          id: tileId,
          url,
        });
      } else {
        await createLink({
          url,
        });
      }

      close();
    },
    [url, tileId, close],
  );

  const pageId = document.body.dataset.pageId;

  return (
    <form onSubmit={submit}>
      <ModalHeader>Add a link</ModalHeader>

      <ModalBody>
        <label>
          Link URL
          <input
            className={styles.input}
            type="url"
            name="content"
            placeholder="Enter a link URL"
            autoFocus
            onChange={onChangeUrl}
            value={url}
          />
        </label>

        <label>Recent pages</label>

        <div className={styles.pages}>
          <PagesGrid
            render={(page) =>
              page.id === pageId ? null : (
                <PageLinkTile
                  pageId={page.id}
                  page={page}
                  onClick={(event) => {
                    event.preventDefault();
                    selectPage(page.id);
                  }}
                />
              )
            }
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!url}>
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
