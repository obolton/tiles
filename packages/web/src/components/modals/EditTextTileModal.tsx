import { useCallback, useRef, useState } from "react";
import client from "../../api/client";
import type { TextTileData } from "../../types/tiles";
import styles from "./EditTextTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: TextTileData;
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

      const result = await client.tiles.createOrUpdate.mutate({
        pageId,
        id: tile?.text.id,
        type: "TEXT",
        content,
      });
      window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));

      close();
    },
    [content, pageId]
  );

  return (
    <form onSubmit={submit}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Text</h2>
      </header>

      <textarea
        className={styles.textarea}
        ref={inputRef}
        onChange={change}
        value={content}
      />

      <footer className={styles.footer}>
        <button type="submit" disabled={!content}>
          Save
        </button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </footer>
    </form>
  );
}
