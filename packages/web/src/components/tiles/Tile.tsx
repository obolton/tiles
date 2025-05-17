import styles from "./Tile.module.css";
import { getFontConfig } from "@/utils/fonts";
import { isReactive } from "@/utils/reactivity";
import { ReactiveValue, Computed, type Reactive } from "@/utils/reactivity";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  background?: boolean;
  border?:
    | Reactive<"inside" | "outside" | "none">
    | "inside"
    | "outside"
    | "none";
  color?: Reactive<Color | null>;
  font?: FontId | null;
  backgroundImageUrl?: string | null;
};

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

export default function Tile({
  className,
  children,
  color = new ReactiveValue(null),
  font,
  background = true,
  border = "outside",
  backgroundImageUrl,
}: TileProps) {
  const fontConfig = typeof font === "string" ? getFontConfig(font) : undefined;
  const style = new Computed([color], (colorValue) => ({
    "--tile-background": colorValue ? toCSSColor(colorValue) : undefined,
    "--font": fontConfig
      ? `"${fontConfig.family}", "${fontConfig.fallback}"`
      : undefined,
    backgroundImage: backgroundImageUrl
      ? `url(${backgroundImageUrl})`
      : undefined,
  }));

  return (
    <div
      classList={[
        styles.tile,
        isReactive(border)
          ? border.derive((value) => BORDER_CLASSES[value])
          : BORDER_CLASSES[border],
        background ? styles.background : undefined,
        color
          ? color.derive((colorValue) =>
              colorValue
                ? isDark(colorValue)
                  ? styles.dark
                  : styles.light
                : undefined,
            )
          : undefined,
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}
