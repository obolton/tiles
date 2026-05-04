import Each from "@/jsx/each";
import ThumbnailItem from "@/components/filmstrip/ThumbnailItem";
import getTileThumbnail from "@/components/filmstrip/getTileThumbnail";
import MapSectionThumbnail from "./MapSectionThumbnail";
import CalendarSectionThumbnail from "./CalendarSectionThumbnail";
import { getSizeStyle } from "@/components/item/Item";
import { combine } from "@/utils/reactivity";
import styles from "./SectionThumbnail.module.css";
import type SectionModel from "@/models/Section";

export interface SectionThumbnailProps {
  section: SectionModel;
}

export default function SectionThumbnail({ section }: SectionThumbnailProps) {
  return section.layout.derive((layout) => {
    if (layout === "MAP") {
      return <MapSectionThumbnail section={section} />;
    }
    if (layout === "CALENDAR") {
      return <CalendarSectionThumbnail section={section} />;
    }

    const sizeStyle = combine(
      { sizing: section.sizing, width: section.width, height: section.height },
      ({ sizing, width, height }) => getSizeStyle(sizing, width, height),
    );

    const style =
      layout === "GRID"
        ? combine(
            { sizeStyle, columns: section.columns },
            ({ sizeStyle, columns }) => ({
              ...sizeStyle,
              "--columns": columns?.toString(),
            }),
          )
        : sizeStyle;

    return (
      <div
        className={styles.contents}
        data-layout={layout}
        data-section-id={section.id}
        style={style}
      >
        <Each items={section.tiles}>
          {(tile) => (
            <ThumbnailItem tile={tile}>{getTileThumbnail(tile)}</ThumbnailItem>
          )}
        </Each>
      </div>
    );
  });
}
