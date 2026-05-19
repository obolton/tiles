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
  const style = combine(
    {
      sizing: tile.sizing,
      width: tile.width,
      height: tile.height,
      background: tile.background,
      theme: tile.theme,
      textColor: tile.textColor,
    },
    ({ sizing, width, height, background, theme, textColor }) => ({
      "--aspect-ratio": getAspect(sizing, width, height).toString(),
      ...getThemeStyles(theme, { background, textColor }),
    }),
  );

  return (
    <div
      role="option"
      aria-controls={tile.id}
      aria-selected="false"
      classList={{
        [styles.thumbnail]: true,
        [styles.hide]: tile.hide,
      }}
      style={style}
    >
      <div className={styles.content} inert>
        {getTileThumbnail(tile)}
      </div>
    </div>
  );
}
