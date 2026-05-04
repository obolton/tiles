import { combine } from "@/utils/reactivity";
import { getAspect } from "@/utils/aspect";
import { getThemeStyles } from "@/utils/themes";
import getTileThumbnail from "./getTileThumbnail";
import styles from "./FilmstripThumbnail.module.css";
import type Tile from "@/models/Tile";

export interface FilmstripThumbnailProps {
  tile: Tile;
}

export default function FilmstripThumbnail({ tile }: FilmstripThumbnailProps) {
  const aspectRatio = combine(
    { sizing: tile.sizing, width: tile.width, height: tile.height },
    ({ sizing, width, height }) => getAspect(sizing, width, height).toString(),
  );

  const themeStyles = combine(
    {
      background: tile.background,
      theme: tile.theme,
      textColor: tile.textColor,
    },
    ({ background, theme, textColor }) =>
      getThemeStyles(theme, { background, textColor }),
  );

  const frameStyle = combine(
    { aspectRatio, themeStyles },
    ({ aspectRatio, themeStyles }) => ({
      "--aspect-ratio": aspectRatio,
      ...themeStyles,
    }),
  );

  return (
    <div
      className={styles.thumbnail}
      role="option"
      aria-controls={tile.id}
      aria-selected="false"
      style={frameStyle}
    >
      {getTileThumbnail(tile)}
    </div>
  );
}
