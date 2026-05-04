import Tile from "@/components/tiles/Tile";
import styles from "./CalendarSectionThumbnail.module.css";
import type SectionModel from "@/models/Section";

const DAYS_PER_WEEK = 7;
const WEEKS = 5;

export interface CalendarSectionThumbnailProps {
  section: SectionModel;
}

export default function CalendarSectionThumbnail({
  section: _section,
}: CalendarSectionThumbnailProps) {
  const cells = Array.from({ length: DAYS_PER_WEEK * WEEKS });

  return (
    <Tile>
      <div className={styles.calendar} aria-hidden="true">
        {cells.map(() => (
          <div className={styles.cell} />
        ))}
      </div>
    </Tile>
  );
}
