import { useMemo } from "react";
import styles from "./Tile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import { getFontConfig } from "@/utils/fonts";
import type { FontId } from "@/config/fonts";

export type TileProps = {
  className?: string;
  children?: React.ReactNode;
  border?: "inside" | "outside" | "none";
  theme?: Theme | null;
  hue?: number | null;
  font?: FontId | null;
  backgroundImageUrl?: string | null;
};

const THEME_CLASSES = {
  LIGHT: styles.light,
  DARK: styles.dark,
  COLOR: styles.color,
} as const;

const BORDER_CLASSES = {
  inside: styles["border-inside"],
  outside: styles["border-outside"],
  none: null,
} as const;

export default function Tile({
  className,
  children,
  theme,
  hue,
  font,
  border = "outside",
  backgroundImageUrl,
}: TileProps) {
  const style = useMemo(() => {
    const fontConfig =
      typeof font === "string" ? getFontConfig(font) : undefined;
    return {
      "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
      "--font": fontConfig
        ? `"${fontConfig.family}", "${fontConfig.fallback}"`
        : undefined,
      backgroundImage: backgroundImageUrl
        ? `url(${backgroundImageUrl})`
        : undefined,
    } as React.CSSProperties;
  }, [hue, font, backgroundImageUrl]);

  return (
    <div
      className={classNames(
        styles.tile,
        BORDER_CLASSES[border],
        theme ? THEME_CLASSES[theme] : undefined,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
