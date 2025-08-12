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
  font?: FontId | null;
  textColor?: Reactive<Color | null>;
  background?: Reactive<TileBackground>;
  border?:
    | Reactive<"inside" | "outside" | "none">
    | "inside"
    | "outside"
    | "none";
};

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

export default function Tile({
  className,
  children,
  textColor = reactive(null),
  background = reactive(null),
  font,
  border = "outside",
}: TileProps) {
  const fontConfig = typeof font === "string" ? getFontConfig(font) : undefined;
  const style = new Computed(
    [textColor, background] as const,
    (textColorValue, backgroundValue) => ({
      "--font": fontConfig
        ? `"${fontConfig.family}", "${fontConfig.fallback}"`
        : undefined,
      "--text-color": textColorValue ? toCSSColor(textColorValue) : undefined,
      "--tile-background":
        backgroundValue && "color" in backgroundValue
          ? toCSSColor(backgroundValue.color)
          : undefined,
      backgroundImage:
        backgroundValue && "imageUrl" in backgroundValue
          ? `url(${backgroundValue.imageUrl})`
          : undefined,
    }),
  );

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
