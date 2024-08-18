import { useCallback, useEffect, useState } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { createTile, updateTile } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import client from "@/api/client";
import type { ClientLinkTile, ClientPageLinkTile } from "@/types/tiles";
import styles from "./EditLinkTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ClientLinkTile | ClientPageLinkTile | null;
}

export default function EditLinkTileModal({ pageId, close, tile }: Props) {
  const [url, setUrl] = useState<string>(
    tile && "link" in tile ? tile.link.url : "",
  );
  const [recentPages, setRecentPages] = useState<
    { id: string; title: string }[]
  >([]);

  useEffect(() => {
    client.pages.getRecent.query().then(setRecentPages);
  }, []);

  const change = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setUrl(event.target.value),
    [],
  );

  const selectPage = useCallback(
    async (linkedPageId: string) => {
      try {
        if (tile) {
          await updateTile({
            id: tile.id,
            type: "PAGE_LINK",
            pageLink: {
              pageId: linkedPageId,
            },
          });
        } else {
          await createTile({
            pageId,
            type: "PAGE_LINK",
            pageLink: {
              pageId: linkedPageId,
            },
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          handleError(error);
        }
      }

      close();
    },
    [close, pageId, tile],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!url) {
        return;
      }

      if (tile) {
        await updateTile({
          id: tile.id,
          type: "LINK",
          link: {
            url,
          },
        });
      } else {
        await createTile({
          pageId,
          type: "LINK",
          link: {
            url,
          },
        });
      }

      close();
    },
    [close, url, pageId, tile],
  );

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
            onChange={change}
            value={url}
          />
        </label>

        <div>
          <label>Your recent pages</label>

          <ol className={styles["page-select"]}>
            {recentPages.map((page) => (
              <li key={page.id} onClick={() => selectPage(page.id)}>
                {page.title}
              </li>
            ))}
          </ol>
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
