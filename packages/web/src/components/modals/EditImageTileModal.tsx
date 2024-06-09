import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "../../utils/media";
import { getImageUrl } from "../../utils/images";
import client from "../../api/client";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import styles from "./EditImageTileModal.module.css";
import type { ClientImageTile } from "../../types/tiles";

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
  const [caption, setCaption] = useState<string>(tile?.image.caption ?? "");

  const selectImage = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const uploadImage = useCallback(async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      return;
    }
    setImageUrl(URL.createObjectURL(file));
    const key = await uploadMedia(file);
    setImageKey(key);
  }, []);

  const captionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setCaption(event.target.value),
    []
  );

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
            caption,
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
            caption,
          },
        });
        window.dispatchEvent(
          new CustomEvent("tile:create", { detail: result })
        );
      }

      close();
    },
    [imageKey, pageId, caption, tile, close]
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Image</ModalHeader>

      <input
        className={styles.input}
        name="file"
        type="file"
        ref={inputRef}
        onChange={uploadImage}
      />
      <section className={styles.placeholder} onClick={selectImage}>
        {imageUrl ? (
          <img className={styles.image} src={imageUrl} alt="Preview" />
        ) : (
          <>Select an image</>
        )}
      </section>

      <textarea
        className={styles.textarea}
        name="caption"
        placeholder="Add a caption"
        autoFocus
        onChange={captionChange}
        value={caption}
      />

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
