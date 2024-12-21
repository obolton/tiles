import { useCallback, useRef, useState, useTransition } from "react";
import ModalFooter from "./ModalFooter";
import styles from "./ImageModal.module.css";
import type { ModalProps } from "@/utils/modals";
import { classNames } from "@/utils/css";

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

export type ImageModalResult = {
  image: File;
};

export default function ImageModal({
  cancel,
  confirm,
}: ModalProps<ImageModalResult>) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [isDragOver, setDragOver] = useState<boolean>(false);

  const selectImage = useCallback(() => inputRef.current?.click(), []);

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

  const setFile = useCallback(
    (file: File) => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(URL.createObjectURL(file));
      setImage(file);
    },
    [imageUrl],
  );

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

  const selectFile = useCallback(() => {
    const file = inputRef.current?.files?.[0];
    if (file) {
      setFile(file);
    }
  }, [setFile]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isPending || !image) {
        return;
      }
      startTransition(async () => confirm({ image }));
    },
    [isPending, confirm, image],
  );

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
          onChange={selectFile}
        />
        {imageUrl ? (
          <img
            className={styles.image}
            src={imageUrl}
            alt="The uploaded image preview"
          />
        ) : (
          <p>Select an image or drag and drop.</p>
        )}
      </section>

      <ModalFooter className={styles.footer}>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
          aria-disabled={!image}
        >
          Save
        </button>
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
