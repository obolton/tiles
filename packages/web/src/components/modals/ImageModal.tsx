import { useCallback, useRef, useState, useTransition } from "react";
import ModalFooter from "./ModalFooter";
import styles from "./ImageModal.module.css";
import type { ModalProps } from "@/utils/modals";
import { classNames } from "@/utils/css";
import { ACCEPT_IMAGE_TYPES, getAcceptableDragItem } from "@/utils/media";

export type ImageModalResult = {
  image: File;
};

interface ImageModalProps extends ModalProps<ImageModalResult> {
  file?: File;
}

export default function ImageModal({ file, cancel, confirm }: ImageModalProps) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | undefined>(file);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    file ? URL.createObjectURL(file) : undefined,
  );
  const [isDragOver, setDragOver] = useState<boolean>(false);

  const selectImage = useCallback(() => inputRef.current?.click(), []);

  const dragOver = useCallback((event: React.DragEvent) => {
    const item = getAcceptableDragItem(event.dataTransfer, ACCEPT_IMAGE_TYPES);
    if (item) {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
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
      const file = getAcceptableDragItem(
        event.dataTransfer,
        ACCEPT_IMAGE_TYPES,
      )?.getAsFile();
      if (file) {
        event.stopPropagation();
        event.preventDefault();
        setFile(file);
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
      startTransition(() => confirm({ image }));
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
          accept={Array.from(ACCEPT_IMAGE_TYPES).join(",")}
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
