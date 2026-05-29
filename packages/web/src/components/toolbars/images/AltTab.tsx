import styles from "./AltTab.module.css";
import type Image from "@/models/Image";

export interface AltTabProps {
  image: Image;
}

export default function AltTab({ image }: AltTabProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const alt = input.value || null;
    if (alt !== image.alt.value) {
      image.alt.value = alt;
    }
  }

  return (
    <toolbar-tab name="alt" label="Alt text">
      <input
        className={styles.alt}
        type="text"
        placeholder="Alt text"
        value={image.alt.value ?? ""}
        on:blur={onBlur}
      />
    </toolbar-tab>
  );
}
