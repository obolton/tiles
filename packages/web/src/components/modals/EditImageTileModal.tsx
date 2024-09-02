import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "@/utils/media";
import { getImageUrl } from "@/utils/images";
import ModalFooter from "./ModalFooter";
import { createTile, updateTile } from "@/utils/edit";
import styles from "./EditImageTileModal.module.css";
import type { ClientImage } from "@/types/tiles";

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

interface Props {
  tileId: string | null;
  close: () => void;
  tile?: ClientImage | null;
}

export default function EditImageTileModal({ tileId, close, tile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    tile ? getImageUrl(tile.imageKey) : null,
  );
  const [imageKey, setImageKey] = useState<string | null>(
    tile?.imageKey ?? null,
  );
  const [caption, setCaption] = useState<string>(tile?.caption ?? "");
  const [isDragOver, setDragOver] = useState<boolean>(false);

  const selectImage = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const dragOver = useCallback((event: React.DragEvent) => {
    const { dataTransfer } = event;
    if (
      dataTransfer.items.length === 1 &&
      ACCEPT_CONTENT_TYPES.includes(dataTransfer.items[0].type)
    ) {
      event.preventDefault();
      dataTransfer.dropEffect = "move";
      setDragOver(true);
    }
  }, []);

  const dragLeave = useCallback(() => setDragOver(false), []);

  const setFile = useCallback(async (file: File) => {
    setImageUrl(URL.createObjectURL(file));
    const key = await uploadMedia(file, "image");
    setImageKey(key);
  }, []);

  const drop = useCallback(
    (event: React.DragEvent) => {
      const { dataTransfer } = event;
      event.preventDefault();
      if (
        dataTransfer.items.length === 1 &&
        ACCEPT_CONTENT_TYPES.includes(dataTransfer.items[0].type)
      ) {
        const file = dataTransfer.items[0].getAsFile();
        if (file) {
          setFile(file);
        }
      }
      setDragOver(false);
    },
    [setFile],
  );

  const uploadImage = useCallback(async () => {
    const file = inputRef.current?.files?.[0];
    if (file) {
      setFile(file);
    }
  }, [setFile]);

  const captionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setCaption(event.target.value),
    [],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!imageKey) {
        return;
      }

      if (tileId) {
        await updateTile(tileId, {
          type: "IMAGE",
          image: {
            imageKey,
            caption,
          },
        });
      } else {
        await createTile({
          type: "IMAGE",
          image: {
            imageKey,
            caption,
          },
        });
      }

      close();
    },
    [imageKey, tileId, close, caption],
  );

  return (
    <form onSubmit={submit}>
      <section
        className={`${styles.placeholder} ${isDragOver ? styles["drag-over"] : ""}`}
        onClick={selectImage}
        onDragOver={dragOver}
        onDragLeave={dragLeave}
        onDrop={drop}
      >
        <input
          className={styles.input}
          name="file"
          type="file"
          accept={ACCEPT_CONTENT_TYPES.join(",")}
          ref={inputRef}
          onChange={uploadImage}
        />
        {imageUrl ? (
          <img
            className={styles.image}
            src={imageUrl}
            alt="The uploaded image preview"
          />
        ) : (
          <>Select an image or drag and drop</>
        )}
      </section>

      {imageUrl && (
        <textarea
          className={styles.textarea}
          name="caption"
          placeholder="Add a caption"
          autoFocus
          onChange={captionChange}
          value={caption}
        />
      )}

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
