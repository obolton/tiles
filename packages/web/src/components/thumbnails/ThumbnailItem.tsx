import { combine } from "reactivity";
import { getSizeStyle } from "@/components/item/Item";
import { getThemeStyles } from "@/utils/themes";
import styles from "./ThumbnailItem.module.css";
import type Tile from "@/models/Tile";
import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

export interface ThumbnailItemProps {
  tile: Tile;
  classList?: { [k: string]: boolean | Reactive<boolean> };
  children?: JSX.Node;
}

export default function ThumbnailItem({ tile, classList, children }: ThumbnailItemProps) {
  const { sizing, x, y, width, height, rowSpan, hide } = tile;

  const position = combine({ x, y }, ({ x, y }) => ({
    "--x": x.toString(),
    "--y": y.toString(),
  }));

  const themeStyles = combine(
    {
      background: tile.background,
      theme: tile.theme,
      textColor: tile.textColor,
    },
    ({ background, theme, textColor }) => getThemeStyles(theme, { background, textColor }),
  );

  const combinedStyles = combine(
    {
      sizing,
      width,
      height,
      rowSpan,
      position,
      themeStyles,
      cornerRadius: tile.cornerRadius,
    },
    ({ sizing, width, height, rowSpan, position, themeStyles, cornerRadius }) => ({
      ...position,
      ...getSizeStyle(sizing, width, height),
      "--rows": rowSpan.toString(),
      ...themeStyles,
      "--border-radius": cornerRadius !== null ? `${cornerRadius}px` : undefined,
    }),
  );

  return (
    <div
      classList={{
        [styles.item]: true,
        [styles["frame-outlined"]]: tile.frame.derive((f) => f === "OUTLINED"),
        [styles["frame-subtle"]]: tile.frame.derive((f) => f === "SUBTLE"),
        [styles["frame-card"]]: tile.frame.derive((f) => f === "CARD"),
        [styles["frame-raised"]]: tile.frame.derive((f) => f === "RAISED"),
        [styles["frame-framed"]]: tile.frame.derive((f) => f === "FRAMED"),
        [styles["frame-full-bleed"]]: tile.frame.derive((f) => f === "FULL_BLEED"),
        "aspect-fixed": sizing.derive((s) => s !== "AUTO" && s !== "CUSTOM"),
        [styles.hide]: hide,
        ...classList,
      }}
      style={combinedStyles}
    >
      {children}
    </div>
  );
}
