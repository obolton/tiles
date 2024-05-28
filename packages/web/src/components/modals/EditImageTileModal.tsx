import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "../../utils/media";
import client from "../../api/client";
import styles from "./EditImageTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
}

export default function EditImageTileModal({ pageId, close }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);

  const selectImage = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const change = useCallback(async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      return;
    }
    setImageUrl(URL.createObjectURL(file));
    const key = await uploadMedia(file);
    setImageKey(key);
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!imageKey) {
        return;
      }
      const tile = await client.tiles.create.mutate({
        pageId,
        type: "IMAGE",
        imageKey,
      });
      window.dispatchEvent(new CustomEvent("tile:add", { detail: tile }));
      close();
    },
    [imageKey, pageId]
  );

  return (
    <form onSubmit={submit}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Image</h2>
      </header>

      <input
        className={styles.input}
        type="file"
        ref={inputRef}
        onChange={change}
      />
      <section className={styles.placeholder} onClick={selectImage}>
        {imageUrl ? (
          <img className={styles.image} src={imageUrl} alt="Preview" />
        ) : (
          <>Select an image</>
        )}
      </section>

      <footer className={styles.footer}>
        <button type="submit" disabled={!imageKey}>
          Save
        </button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </footer>
    </form>
  );
}
