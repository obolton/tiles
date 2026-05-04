import Each from "@/jsx/each";
import FilmstripThumbnail from "./FilmstripThumbnail";
import styles from "./FilmstripPanel.module.css";
import type TileCollection from "@/models/TileCollection";

export interface FilmstripPanelProps {
  tiles: TileCollection;
}

export default function FilmstripPanel({ tiles }: FilmstripPanelProps) {
  return (
    <aside classList={{ [styles.panel]: true, "filmstrip-panel": true }}>
      <filmstrip-view className={styles.rail} aria-label="Slide navigator">
        <Each items={tiles}>
          {(tile) => <FilmstripThumbnail tile={tile} />}
        </Each>
      </filmstrip-view>
    </aside>
  );
}
