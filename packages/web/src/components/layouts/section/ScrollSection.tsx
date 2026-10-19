import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import Each from "@/jsx/each";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./ScrollSection.module.css";
import type ScrollView from "@/elements/scroll-view/ScrollView";
import type SectionModel from "@/models/Section";
import type { Layout } from "doc/types/tiles/section";
import type { Reactive } from "reactivity";

export interface ScrollSectionProps {
  section: SectionModel;
  layout: Layout;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<string | null>;
  signal?: AbortSignal;
}

export default function ScrollSection({
  section,
  layout,
  tabindex,
  resize,
  signal,
}: ScrollSectionProps) {
  const { tiles } = section;

  const style =
    layout === "GRID"
      ? {
          "--columns": section.columns.derive((columns) => columns?.toString()),
        }
      : undefined;

  function ref(element: ScrollView) {
    LayoutEditor.attach({
      element,
      grid: element.contents,
      layoutType: layout,
      dropTarget: element,
      page: section.page,
      sectionId: section.id,
      signal,
    });
  }

  return (
    <scroll-view
      ref={ref}
      classList={{
        [styles.contents]: true,
        [styles.grid]: layout === "GRID",
        [styles.horizontal]: layout === "HORIZONTAL",
        [styles.vertical]: layout === "VERTICAL",
        [styles.freeform]: layout === "FREEFORM",
      }}
      style={style}
      data-section-id={section.id}
      data-layout={layout}
      tabindex={tabindex}
    >
      <Each items={tiles}>
        {(tile) => (
          <Item classList={{ [styles.item]: true }} tile={tile} tabindex={tabindex} resize={resize}>
            <TileContent tile={tile} />
          </Item>
        )}
      </Each>
    </scroll-view>
  );
}
