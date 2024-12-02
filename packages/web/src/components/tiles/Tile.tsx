import { useMemo, useRef } from "react";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import styles from "./Tile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";

export type TileProps = {
  id: string;
  children?: React.ReactNode;
  showBorder?: boolean;
  theme?: Theme | null;
  hue?: number | null;
  font?: string | null;
  backgroundImageUrl?: string;
};

export default function Tile({
  children,
  theme,
  hue,
  font,
  showBorder = true,
  backgroundImageUrl,
}: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollIntoView(ref);

  const style = useMemo(
    () =>
      ({
        "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
        backgroundImage: backgroundImageUrl
          ? `url(${backgroundImageUrl})`
          : undefined,
      }) as React.CSSProperties,
    [hue, backgroundImageUrl],
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
