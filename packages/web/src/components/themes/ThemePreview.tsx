import { getThemeStyles } from "@/utils/themes";
import { getBackgroundColor } from "@/utils/backgrounds";
import { toCSSColor } from "@/utils/color";
import styles from "./ThemePreview.module.css";
import type { Reactive } from "reactivity";
import type { ThemeData } from "@/models/Theme";

export interface ThemePreviewProps {
  theme: Reactive<ThemeData>;
}

export default function ThemePreview({ theme }: ThemePreviewProps) {
  const style = theme.derive((data) => getThemeStyles(data));
  // Concrete colours, so the swatch still renders when cloned as a list-select icon
  const background = theme.derive((data) =>
    toCSSColor(getBackgroundColor(data.background) ?? data.colors.text),
  );
  const accent = theme.derive((data) => toCSSColor(data.colors.accent));

  return (
    <div className={styles.preview} style={style}>
      <svg className={styles.swatch} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={background} stroke="rgb(0 0 0 / 15%)" />
        <circle cx="12" cy="12" r="5" fill={accent} />
      </svg>
      <div className={styles.content}>
        <p className={styles.heading}>{theme.derive((data) => data.name)}</p>
        <p className={styles.body}>Body text in the theme font.</p>
        <p className={styles.code}>const code = true;</p>
      </div>
    </div>
  );
}
