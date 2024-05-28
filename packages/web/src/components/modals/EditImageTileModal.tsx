import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "../../utils/media";
import { getImageUrl } from "../../utils/images";
import client from "../../api/client";
import type { ImageTileData } from "../../types/tiles";
import styles from "./EditImageTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ImageTileData;
}

export default function EditImageTileModal({ pageId, close, tile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    tile ? getImageUrl(tile.image.imageKey) : null
  );
  const [imageKey, setImageKey] = useState<string | null>(
    tile?.image.imageKey ?? null
  );

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

      const result = await client.tiles.createOrUpdate.mutate({
        pageId,
        type: "IMAGE",
        id: tile?.image.id,
        imageKey,
      });
      window.dispatchEvent(new CustomEvent("tile:update", { detail: result }));

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
