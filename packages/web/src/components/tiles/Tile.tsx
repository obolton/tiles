import styles from "./Tile.module.css";
import { reactive, isReactive, type Reactive } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";
import type { Animation } from "@/models/Tile";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
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
  animation = reactive(null),
  border = "outside",
  anchorName,
}: TileProps) {
  const style = animation.derive((value) => ({
    "--animation-name": value ? ANIMATION_NAMES[value] : undefined,
    anchorName,
  }));

  return (
    <div
      classList={[
        styles.tile,
        isReactive(border)
          ? border.derive((value) => BORDER_CLASSES[value])
          : BORDER_CLASSES[border],
        animation.derive((value) => (value ? styles.animate : undefined)),
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}
