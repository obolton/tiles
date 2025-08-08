import styles from "./Tile.module.css";
import { getFontConfig } from "@/utils/fonts";
import {
  reactive,
  isReactive,
  Computed,
  type Reactive,
} from "@/utils/reactivity";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export type TileBackground = { imageUrl: string } | { color: Color } | null;

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  border?:
    | Reactive<"inside" | "outside" | "none">
    | "inside"
    | "outside"
    | "none";
  background?: Reactive<TileBackground>;
  font?: FontId | null;
};

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

export default function Tile({
  className,
  children,
  background = reactive(null),
  font,
  border = "outside",
}: TileProps) {
  const fontConfig = typeof font === "string" ? getFontConfig(font) : undefined;
  const style = new Computed([background] as const, (value) => ({
    "--tile-background":
      value && "color" in value ? toCSSColor(value.color) : undefined,
    "--font": fontConfig
      ? `"${fontConfig.family}", "${fontConfig.fallback}"`
      : undefined,
    backgroundImage:
      value && "imageUrl" in value ? `url(${value.imageUrl})` : undefined,
  }));

  return (
    <div
      classList={[
        styles.tile,
        isReactive(border)
          ? border.derive((value) => BORDER_CLASSES[value])
          : BORDER_CLASSES[border],
        background
          ? background.derive((value) =>
              value && "color" in value
                ? isDark(value.color)
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
