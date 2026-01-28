import styles from "./Tile.module.css";
import { reactive, isReactive, type Reactive } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";
import type { Animation, FrameStyle } from "@/models/Tile";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  animation?: Reactive<Animation | null>;
  frame?: Reactive<FrameStyle | null> | FrameStyle | null;
  anchorName?: string;
};

const FRAME_CLASSES = {
  NONE: null,
  OUTLINED: styles["frame-outlined"],
  SUBTLE: styles["frame-subtle"],
  CARD: styles["frame-card"],
  RAISED: styles["frame-raised"],
  FRAMED: styles["frame-framed"],
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
  frame = null,
  anchorName,
}: TileProps) {
  const style = animation.derive((value) => ({
    "--animation-name": value ? ANIMATION_NAMES[value] : undefined,
    anchorName,
  }));

  const frameClass = isReactive(frame)
    ? frame.derive((value) => (value ? FRAME_CLASSES[value] : null))
    : frame
      ? FRAME_CLASSES[frame]
      : null;

  return (
    <div
      classList={[
        styles.tile,
        frameClass,
        animation.derive((value) => (value ? styles.animate : undefined)),
        className,
      ]}
      style={style}
    >
      {children}
    </div>
  );
}
