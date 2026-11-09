import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import styles from "./AltText.module.css";
import type Image from "@/models/Image";

export interface AltTextProps {
  image: Image;
}

export default function AltText({ image }: AltTextProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const alt = input.value || null;
    if (alt !== image.alt.value) {
      image.alt.value = alt;
    }
  }

  return (
    <ToolbarGroup label="Alt text">
      <input
        className={styles.alt}
        type="text"
        placeholder="Alt text"
        aria-label="Alt text"
        value={image.alt.value ?? ""}
        on:blur={onBlur}
      />
    </ToolbarGroup>
  );
}
