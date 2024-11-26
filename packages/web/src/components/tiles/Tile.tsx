import { useEffect, useMemo, useRef } from "react";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import styles from "./Tile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import type { DragDropEvent } from "@/utils/drag";

export type TileProps = {
  id: string;
  children?: React.ReactNode;
  showBorder?: boolean;
  theme?: Theme | null;
  hue?: number | null;
  font?: string | null;
  onDrop?: (event: DragDropEvent) => void;
};

export default function Tile({
  children,
  theme,
  hue,
  font,
  showBorder = true,
  onDrop,
}: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollIntoView(ref);

  useEffect(() => {
    const element = ref.current;
    if (!element || !onDrop) {
      return;
    }
    element.addEventListener("drag:drop-on", onDrop);
    return () => element.removeEventListener("drag:drop-on", onDrop);
  }, [onDrop]);

  const style = useMemo(
    () =>
      ({
        "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
      }) as React.CSSProperties,
    [hue],
  );

  return (
    <div
      ref={ref}
      className={classNames(
        styles.tile,
        showBorder && styles.border,
        theme === "LIGHT"
          ? styles.light
          : theme === "DARK"
            ? styles.dark
            : styles.color,
      )}
      data-font={font}
      style={style}
    >
      {children}
    </div>
  );
}
