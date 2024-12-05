import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "@/utils/media";
import ModalFooter from "./ModalFooter";
import { createImage } from "@/utils/edit";
import styles from "./ImageModal.module.css";
import type { ModalProps } from "@/utils/modals";

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

export default function ImageModal({ close }: ModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [isDragOver, setDragOver] = useState<boolean>(false);

  const selectImage = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const dragOver = useCallback((event: React.DragEvent) => {
    const { dataTransfer } = event;
    const { items } = dataTransfer;
    if (
      items.length === 1 &&
      items[0] &&
      ACCEPT_CONTENT_TYPES.includes(items[0].type)
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
      const { items } = dataTransfer;
      event.preventDefault();
      if (
        items.length === 1 &&
        items[0] &&
        ACCEPT_CONTENT_TYPES.includes(items[0].type)
      ) {
        const file = items[0].getAsFile();
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

      await createImage({
        imageKey,
        caption,
      });

      close();
    },
    [imageKey, close, caption],
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
