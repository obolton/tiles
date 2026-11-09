import Each from "jsx/each";
import If from "jsx/if";
import Portal from "jsx/portal";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import SectionToolbar from "@/components/layouts/section/SectionToolbar";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Slide.module.css";
import type SectionModel from "@/models/Section";
import type { Reactive } from "carillon";

export interface SlideProps {
  section: SectionModel;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<string | null>;
  signal?: AbortSignal;
}

export default function Slide({ section, tabindex, resize, signal }: SlideProps) {
  const { tiles, editor } = section;

  const showToolbar = editor.selection.derive(
    (selection) => selection.has(section.id) && selection.size === 1,
  );

  function ref(element: HTMLElement) {
    LayoutEditor.attach({
      element,
      grid: element,
      layoutType: "FREEFORM",
      page: section.page,
      sectionId: section.id,
      accepts: (tile) => tile.parentId.value !== null,
      signal,
    });
  }

  return (
    <Item tile={section} classList={{ [styles.frame]: true }} tabindex={tabindex} draggable={false}>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <SectionToolbar section={section} />
        </Portal>
      </If>

      <section
        ref={ref}
        className={styles.slide}
        style={{ "--width": section.width }}
        data-section-id={section.id}
        tabindex={tabindex}
        aria-label="Slide"
      >
        <Each items={tiles}>
          {(tile) => (
            <Item tile={tile} tabindex={tabindex} resize={resize}>
              <TileContent tile={tile} />
            </Item>
          )}
        </Each>
      </section>
    </Item>
  );
}
