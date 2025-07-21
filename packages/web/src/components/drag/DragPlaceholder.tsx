import { Computed } from "@/utils/reactivity";
import styles from "./DragPlaceholder.module.css";
import type { Reactive } from "@/utils/reactivity";

export interface DragPlaceholderProps {
  x: Reactive<number>;
  y: Reactive<number>;
  width: Reactive<number>;
  height: Reactive<number>;
}

export default function DragPlaceholder({
  x,
  y,
  width,
  height,
}: DragPlaceholderProps) {
  const style = new Computed(
    [x, y, width, height],
    (xValue, yValue, widthValue, heightValue) => ({
      "--x": xValue.toString(),
      "--y": yValue.toString(),
      "--width": widthValue.toString(),
      "--height": heightValue.toString(),
    }),
  );

  return (
    <div
      className={styles.placeholder}
      style={style}
      data-animate-layout-id="drag-placeholder"
    />
  );
}
