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
import type { Background } from "@/components/backgrounds/types";
import type { Animation } from "@/models/Tile";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  font?: FontId | null;
  textColor?: Reactive<Color | null>;
  background?: Reactive<Background | null>;
  animation?: Reactive<Animation | null>;
  border?:
    | Reactive<"inside" | "outside" | "none">
    | "inside"
    | "outside"
    | "none";
  anchorName?: string;
};

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

const ANIMATION_NAMES: Record<Animation, string> = {
  FADE: "fade-in",
  SLIDE: "slide-in",
  GROW: "grow-in",
  SHRINK: "shrink-in",
};

export default function Tile({
  className,
  children,
  textColor = reactive(null),
  background = reactive(null),
  animation = reactive(null),
  font,
  border = "outside",
  anchorName,
}: TileProps) {
  const fontConfig = typeof font === "string" ? getFontConfig(font) : undefined;
  const style = new Computed(
    [textColor, background, animation] as const,
    (textColorValue, backgroundValue, animationValue) => ({
      "--font": fontConfig
        ? `"${fontConfig.family}", "${fontConfig.fallback}"`
        : undefined,
      "--text-color": textColorValue ? toCSSColor(textColorValue) : undefined,
      "--background-color":
        backgroundValue && "color" in backgroundValue
          ? toCSSColor(backgroundValue.color)
          : "transparent",
      "--animation-name": animationValue
        ? ANIMATION_NAMES[animationValue]
        : undefined,
      backgroundImage:
        backgroundValue && "imageUrl" in backgroundValue
          ? `url(${backgroundValue.imageUrl})`
          : undefined,
      anchorName,
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
        animation?.derive((value) => (value ? styles.animate : undefined)),
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}
