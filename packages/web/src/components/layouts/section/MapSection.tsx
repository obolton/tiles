import MapPin from "./MapPin";
import MapEditor from "@/editor/MapEditor";
import Each from "jsx/each";
import styles from "./MapSection.module.css";
import type MapView from "@/elements/maps/MapView";
import type SectionModel from "@/models/Section";
import type { Reactive } from "carillon";

export interface MapSectionProps {
  section: SectionModel;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<string | null>;
  signal?: AbortSignal;
}

export default function MapSection({ section, tabindex, resize, signal }: MapSectionProps) {
  const { tiles, editor } = section;

  function ref(element: MapView) {
    MapEditor.attach({
      element,
      page: editor.page,
      sectionId: section.id,
      signal,
    });
  }

  return (
    <map-view
      ref={ref}
      classList={{ [styles.map]: true }}
      data-section-id={section.id}
      data-layout="MAP"
      movable
      tabindex={tabindex}
      mapstyle={section.mapStyle}
    >
      <Each items={tiles}>
        {(tile) => <MapPin tile={tile} editor={editor} tabindex={tabindex} resize={resize} />}
      </Each>
    </map-view>
  );
}
