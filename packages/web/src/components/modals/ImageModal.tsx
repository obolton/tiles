import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "@/utils/media";
import ModalFooter from "./ModalFooter";
import styles from "./ImageModal.module.css";
import type { ModalProps } from "@/utils/modals";

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

export type ImageModalResult = {
  imageKey: string;
};

export default function ImageModal({ close }: ModalProps<ImageModalResult>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
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

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!imageKey) {
        return;
      }
      close({ imageKey });
    },
    [imageKey, close],
  );

  const cancel = useCallback(() => close(), [close]);

  return (
    <form className={styles.form} onSubmit={submit}>
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
          <p>Select an image or drag and drop</p>
        )}
      </section>

      <ModalFooter className={styles.footer}>
        <button className="primary" type="submit" aria-disabled={!imageKey}>
          Save
        </button>
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
