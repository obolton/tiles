import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "../../utils/media";
import { getImageUrl } from "../../utils/images";
import client from "../../api/client";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import type { ClientImageTile } from "../../types/tiles";
import styles from "./EditImageTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ClientImageTile | null;
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

      if (tile) {
        const result = await client.tiles.update.mutate({
          pageId,
          type: "IMAGE",
          id: tile.id,
          image: {
            imageKey,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:update", { detail: result })
        );
      } else {
        const result = await client.tiles.create.mutate({
          pageId,
          type: "IMAGE",
          image: {
            imageKey,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:create", { detail: result })
        );
      }

      close();
    },
    [imageKey, pageId]
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Image</ModalHeader>

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

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!imageKey}>
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
