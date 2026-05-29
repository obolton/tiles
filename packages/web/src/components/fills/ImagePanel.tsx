import { ACCEPT_IMAGE_TYPES } from "@/utils/media";
import { handleError } from "@/utils/errors";
import { uploadMedia } from "@/utils/media";
import Editor from "@/editor/Editor";
import styles from "./ImagePanel.module.css";
import type { ImageFill } from "./types";
import type FilePicker from "@/elements/file-picker/FilePicker";

export interface ImagePanelProps {
  onChange: (value: ImageFill) => void;
}

export default function ImagePanel({ onChange }: ImagePanelProps) {
  function onSelectFile(event: Event) {
    const file = (event.currentTarget as FilePicker).file;
    if (!file) {
      return;
    }
    uploadMedia({
      file,
      purpose: "content",
      workspaceId: Editor.current.workspaceId,
    })
      .then(({ id }) => onChange({ type: "image", imageId: id }))
      .catch(handleError);
  }

  return (
    <file-picker
      className={styles.file}
      accept={Array.from(ACCEPT_IMAGE_TYPES).join(",")}
      tabindex={0}
      on:change={onSelectFile}
    >
      Select an image or drag and drop
    </file-picker>
  );
}
