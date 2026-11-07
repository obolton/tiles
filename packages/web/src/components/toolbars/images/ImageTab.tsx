import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import styles from "./ImageTab.module.css";
import type Image from "@/models/Image";

export interface ImageTabProps {
  image: Image;
}

export default function ImageTab({ image }: ImageTabProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const alt = input.value || null;
    if (alt !== image.alt.value) {
      image.alt.value = alt;
    }
  }

  return (
    <toolbar-tab name="image" label="Image">
      <ToolbarGroup label="Alt text">
        <label className={styles.alt}>
          Alt text
          <input
            type="text"
            placeholder="Describe the image"
            value={image.alt.value ?? ""}
            on:blur={onBlur}
          />
        </label>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
