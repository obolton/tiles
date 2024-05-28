import { useCallback, useRef, useState } from "react";
import client from "../../api/client";
import styles from "./EditTextTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
}

export default function EditTextTileModal({ pageId, close }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<string | null>(null);

  const change = useCallback(async () => {
    setContent(inputRef.current?.value ?? null);
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!content) {
        return;
      }
      const tile = await client.tiles.create.mutate({
        pageId,
        type: "TEXT",
        content,
      });
      window.dispatchEvent(new CustomEvent("tile:add", { detail: tile }));
      close();
    },
    [content, pageId]
  );

  return (
    <form onSubmit={submit}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Text</h2>
      </header>

      <textarea className={styles.textarea} ref={inputRef} onChange={change} />

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
