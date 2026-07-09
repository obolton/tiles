import Each from "@/jsx/each";
import ThumbnailItem from "@/components/filmstrip/ThumbnailItem";
import getTileThumbnail from "@/components/filmstrip/getTileThumbnail";
import { getSizeStyle } from "@/components/item/Item";
import { getAspect } from "@/utils/aspect";
import { getThemeStyles } from "@/utils/themes";
import { combine } from "@/utils/reactivity";
import slideStyles from "./Slide.module.css";
import styles from "./SlideThumbnail.module.css";
import type SectionModel from "@/models/Section";

export interface SlideThumbnailProps {
  section: SectionModel;
}

export default function SlideThumbnail({ section }: SlideThumbnailProps) {
  const style = combine(
    {
      sizing: section.sizing,
      width: section.width,
      height: section.height,
      background: section.background,
      theme: section.theme,
      textColor: section.textColor,
    },
    ({ sizing, width, height, background, theme, textColor }) => ({
      "--aspect-ratio": getAspect(sizing, width, height).toString(),
      ...getThemeStyles(theme, { background, textColor }),
    }),
  );

  const sizeStyle = combine(
    { sizing: section.sizing, width: section.width, height: section.height },
    ({ sizing, width, height }) => getSizeStyle(sizing, width, height),
  );

  return (
    <div
      role="option"
      aria-controls={section.id}
      aria-selected="false"
      classList={{
        [styles.thumbnail]: true,
        [styles.hide]: section.hide,
      }}
      style={style}
    >
      <div
        className={slideStyles.slide}
        style={sizeStyle}
        data-section-id={section.id}
        data-layout="FREEFORM"
        inert
      >
        <Each items={section.tiles}>
          {(tile) => <ThumbnailItem tile={tile}>{getTileThumbnail(tile)}</ThumbnailItem>}
        </Each>
      </div>
    </div>
  );
}
