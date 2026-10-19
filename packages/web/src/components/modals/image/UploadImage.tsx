import { ACCEPT_IMAGE_TYPES } from "@/utils/media";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import styles from "./UploadImage.module.css";
import { ReactiveValue } from "reactivity";
import { handleError } from "@/utils/errors";
import type FilePicker from "@/elements/file-picker/FilePicker";

interface UploadImageProps {
  file?: File;
  confirm: ({ image }: { image: File }) => void;
  cancel: () => void;
}

export default function UploadImage({ file: initialFile, confirm, cancel }: UploadImageProps) {
  const isPending = new ReactiveValue(false);
  const file = new ReactiveValue(initialFile);
  const imageUrl = new ReactiveValue(initialFile ? URL.createObjectURL(initialFile) : undefined);

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
    <form on:submit={onSubmit}>
      <ModalBody>
        <file-picker
          className={styles.file}
          accept={Array.from(ACCEPT_IMAGE_TYPES).join(",")}
          on:change={onChange}
        >
          {imageUrl.derive((url) =>
            url ? (
              <img className={styles.image} src={url} alt={file.value?.name ?? ""} />
            ) : (
              <p>Select an image or drag and drop</p>
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

        <button className="secondary" type="button" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
