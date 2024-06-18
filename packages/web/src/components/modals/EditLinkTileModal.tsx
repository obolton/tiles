import { useCallback, useState } from "react";
import client from "../../api/client";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import type { ClientLinkTile } from "../../types/tiles";
import styles from "./EditLinkTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ClientLinkTile | null;
}

export default function EditLinkTileModal({ pageId, close, tile }: Props) {
  const [url, setUrl] = useState<string>(tile?.link.url ?? "");

  const change = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setUrl(event.target.value),
    []
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!url) {
        return;
      }

      if (tile) {
        const result = await client.tiles.update.mutate({
          pageId,
          id: tile.id,
          type: "LINK",
          link: {
            url,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:update", { detail: result })
        );
      } else {
        const result = await client.tiles.create.mutate({
          pageId,
          type: "LINK",
          link: {
            url,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:create", { detail: result })
        );
      }

      close();
    },
    [close, url, pageId, tile]
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Link</ModalHeader>

      <input
        className={styles.input}
        type="url"
        name="content"
        placeholder="Paste a URL"
        autoFocus
        onChange={change}
        value={url}
      />

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
