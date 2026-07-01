import Tile from "@/components/tiles/Tile";
import styles from "./MapSectionThumbnail.module.css";
import type SectionModel from "@/models/Section";

export interface MapSectionThumbnailProps {
  section: SectionModel;
}

export default function MapSectionThumbnail({ section: _section }: MapSectionThumbnailProps) {
  return (
    <Tile>
      <div className={styles.map} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </Tile>
  );
}
