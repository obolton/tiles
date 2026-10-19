import { combine } from "reactivity";
import { resolveThemeStyles, toCSSProperties } from "@/utils/themes";
import SettingsIcon from "@/icons/settings.svg?jsx";
import styles from "./ThemePreview.module.css";
import type Theme from "@/models/Theme";

export interface ThemePreviewProps extends Pick<
  Theme,
  "name" | "background" | "colors" | "fonts" | "border"
> {
  showEdit?: boolean;
  onEdit?: (event: Event) => void;
}

export default function ThemePreview({
  name,
  background,
  colors,
  fonts,
  border,
  showEdit,
  onEdit,
}: ThemePreviewProps) {
  const previewStyle = combine({ background, colors, fonts, border }, (theme) =>
    toCSSProperties(resolveThemeStyles(theme)),
  );

  return (
    <div className={styles.preview} style={previewStyle}>
      <div className={styles.content}>
        <p className={styles.heading}>{name}</p>
        <p className={styles.body}>Body text in the theme font.</p>
        <p className={styles.code}>const code = true;</p>
      </div>
      {showEdit && (
        <button
          type="button"
          className={`floating small ${styles.edit}`}
          aria-label="Edit theme"
          on:click={onEdit}
        >
          <SettingsIcon aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
