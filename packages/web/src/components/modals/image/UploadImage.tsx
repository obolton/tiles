import { ACCEPT_IMAGE_TYPES } from "@/utils/media";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import Placeholder from "@/components/placeholder/Placeholder";
import styles from "./UploadImage.module.css";
import { Store } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
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
  const isPending = new Store(false);
  const file = new Store(initialFile);
  const imageUrl = new Store(
    initialFile ? URL.createObjectURL(initialFile) : undefined,
  );

  const onChange = (event: Event) => {
    const newFile = (event.target as FilePicker).file;
    if (!newFile) {
      return;
    }
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
    }
    imageUrl.value = URL.createObjectURL(newFile);
    file.value = newFile;
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (isPending.value || !file.value) {
      return;
    }
    isPending.value = true;
    try {
      confirm({ image: file.value });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <ModalBody>
        <file-picker
          className={styles.file}
          accept={Array.from(ACCEPT_IMAGE_TYPES).join(",")}
          onchange={onChange}
        >
          {imageUrl.derive((url) =>
            url ? (
              <img
                className={styles.image}
                src={imageUrl}
                alt={file.value?.name ?? ""}
              />
            ) : (
              <Placeholder>Select an image or drag and drop</Placeholder>
            ),
          )}
        </file-picker>
      </ModalBody>

      <ModalFooter>
        <button
          classList={{ primary: true, pending: isPending }}
          type="submit"
          aria-disabled={!file}
        >
          Save
        </button>

        <button className="secondary" type="button" onclick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
