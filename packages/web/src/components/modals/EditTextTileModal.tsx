import { useCallback, useRef, useState } from "react";
import client from "../../api/client";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import type { ClientTextTile } from "../../types/tiles";
import styles from "./EditTextTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ClientTextTile | null;
}

export default function EditTextTileModal({ pageId, close, tile }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<string>(tile?.text.content ?? "");

  const change = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setContent(event.target.value),
    []
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!content) {
        return;
      }

      if (tile) {
        const result = await client.tiles.update.mutate({
          pageId,
          id: tile.id,
          type: "TEXT",
          text: {
            content,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:update", { detail: result })
        );
      } else {
        const result = await client.tiles.create.mutate({
          pageId,
          type: "TEXT",
          text: {
            content,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:create", { detail: result })
        );
      }

      close();
    },
    [content, pageId]
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Text</ModalHeader>

      <textarea
        className={styles.textarea}
        ref={inputRef}
        onChange={change}
        value={content}
      />

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!content}>
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
