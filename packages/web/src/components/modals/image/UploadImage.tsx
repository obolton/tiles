import { useCallback, useState, useTransition } from "react";
import { ACCEPT_IMAGE_TYPES } from "@/utils/media";
import { classNames } from "@/utils/css";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import Placeholder from "@/components/placeholder/Placeholder";
import styles from "./UploadImage.module.css";
import type FilePicker from "@/elements/filePicker/FilePicker";

interface UploadImageProps {
  file?: File;
  confirm: ({ image }: { image: File }) => void;
  cancel: () => void;
}

export default function UploadImage({
  file: initialFile,
  confirm,
  cancel,
}: UploadImageProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | undefined>(initialFile);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    initialFile ? URL.createObjectURL(initialFile) : undefined,
  );

  const onChange = useCallback(
    (event: Event) => {
      const file = (event.target as FilePicker).file;
      if (!file) {
        return;
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(URL.createObjectURL(file));
      setFile(file);
    },
    [imageUrl],
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isPending || !file) {
        return;
      }
      startTransition(() => confirm({ image: file }));
    },
    [isPending, confirm, file],
  );

  return (
    <form onSubmit={onSubmit}>
      <ModalBody>
        <file-picker
          class={styles.file}
          accept={Array.from(ACCEPT_IMAGE_TYPES).join(",")}
          onchange={onChange}
        >
          {file && imageUrl ? (
            <img className={styles.image} src={imageUrl} alt={file.name} />
          ) : (
            <Placeholder>Select an image or drag and drop</Placeholder>
          )}
        </file-picker>
      </ModalBody>

      <ModalFooter>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
          aria-disabled={!file}
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
