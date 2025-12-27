import styles from "./Tile.module.css";
import {
  reactive,
  isReactive,
  Computed,
  type Reactive,
} from "@/utils/reactivity";
import { isDark, type Color } from "@/utils/color";
import { getBackgroundStyle } from "@/utils/backgrounds";
import { resolveThemeStyles, toCSSProperties } from "@/utils/themes";
import type { Theme } from "api/types/themes";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";
import type { Fill } from "@/components/fills/types";
import type { Animation } from "@/models/Tile";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  theme?: Reactive<Theme | null>;
  font?: FontId | null;
  textColor?: Reactive<Color | null>;
  background?: Reactive<Fill | null>;
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
  theme = reactive(null),
  textColor = reactive(null),
  background = reactive(null),
  animation = reactive(null),
  font,
  border = "outside",
  anchorName,
}: TileProps) {
  const style = new Computed(
    [theme, textColor, background, animation] as const,
    (themeValue, textColorValue, backgroundValue, animationValue) => {
      const resolved = resolveThemeStyles(themeValue, {
        textColor: textColorValue,
        font,
      });

      // TODO: Support Fill types in theme backgrounds
      const effectiveBackground =
        backgroundValue ??
        (resolved.backgroundColor
          ? { type: "color" as const, color: resolved.backgroundColor }
          : null);

      return {
        ...toCSSProperties(resolved),
        "--animation-name": animationValue
          ? ANIMATION_NAMES[animationValue]
          : undefined,
        anchorName,
        ...getBackgroundStyle(effectiveBackground),
      };
    },
  );

  return (
    <div
      classList={[
        styles.tile,
        isReactive(border)
          ? border.derive((value) => BORDER_CLASSES[value])
          : BORDER_CLASSES[border],
        background
          ? background.derive((value) => {
              const color =
                value?.type === "color"
                  ? value.color
                  : value?.type === "gradient"
                    ? value.colorA
                    : null;
              if (!color) return undefined;
              return isDark(color) ? styles.dark : styles.light;
            })
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
