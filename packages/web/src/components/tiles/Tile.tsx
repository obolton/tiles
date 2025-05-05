import styles from "./Tile.module.css";
import { getFontConfig } from "@/utils/fonts";
import { isStore } from "@/utils/stores";
import type { Theme } from "@/types/pages";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";
import type { StoreInterface } from "@/utils/stores";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  background?: boolean;
  border?:
    | StoreInterface<"inside" | "outside" | "none">
    | "inside"
    | "outside"
    | "none";
  theme?: StoreInterface<Theme | null | undefined>;
  hue?: StoreInterface<number | null | undefined>;
  font?: FontId | null;
  backgroundImageUrl?: string | null;
};

const THEME_CLASSES = {
  LIGHT: styles.light,
  DARK: styles.dark,
  COLOR: styles.color,
} as const;

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

export default function Tile({
  className,
  children,
  theme,
  hue,
  font,
  background = true,
  border = "outside",
  backgroundImageUrl,
}: TileProps) {
  const fontConfig = typeof font === "string" ? getFontConfig(font) : undefined;
  const style = {
    "--hue":
      typeof hue?.value === "number" ? `${hue.value.toFixed(2)}deg` : undefined,
    "--font": fontConfig
      ? `"${fontConfig.family}", "${fontConfig.fallback}"`
      : undefined,
    backgroundImage: backgroundImageUrl
      ? `url(${backgroundImageUrl})`
      : undefined,
  };

  return (
    <div
      classList={[
        styles.tile,
        isStore(border)
          ? border.derive((value) => BORDER_CLASSES[value])
          : BORDER_CLASSES[border],
        background ? styles.background : undefined,
        isStore(theme)
          ? theme.derive((value) => (value ? THEME_CLASSES[value] : undefined))
          : undefined,
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}
