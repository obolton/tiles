import { useMemo } from "react";
import styles from "./Tile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import { getFontConfig } from "@/utils/fonts";
import type { FontId } from "@/config/fonts";

export type TileProps = {
  children?: React.ReactNode;
  showBorder?: boolean;
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

export default function Tile({
  children,
  theme,
  hue,
  font,
  showBorder = true,
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
        showBorder && styles.border,
        theme ? THEME_CLASSES[theme] : undefined,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
