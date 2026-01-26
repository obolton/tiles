import Item from "@/components/item/Item";
import { combine } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Section.module.css";
import type ScrollView from "@/elements/scroll-view/ScrollView";
import type SectionModel from "@/models/Section";
import type { Reactive } from "@/utils/reactivity";

export interface SectionProps {
  section: SectionModel;
  showToolbar: Reactive<boolean>;
  signal?: AbortSignal;
}

export default function Section({
  section,
  showToolbar,
  signal,
}: SectionProps) {
  const { id, layout, tiles, editor } = section;
  const { isEditable } = editor;

  function ref(element: ScrollView) {
    LayoutEditor.attach({
      element,
      grid: element.contents,
      layoutType: section.layout.value,
      dropTarget: element,
      editor,
      sectionId: id,
      signal,
    });
  }

  const layoutClass = layout.derive((value) => {
    switch (value) {
      case "GRID":
        return styles.grid;
      case "HORIZONTAL":
        return styles.horizontal;
      case "VERTICAL":
        return styles.vertical;
      case "FREEFORM":
        return styles.freeform;
    }
  });

  const resize = combine({ isEditable, layout }).derive(
    ({ isEditable, layout }) => {
      if (!isEditable) {
        return null;
      }

      switch (layout) {
        case "GRID":
        case "FREEFORM":
          return "all";
        case "HORIZONTAL":
          return "horizontal";
        case "VERTICAL":
          return "vertical";
      }
    },
  );

  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));

  return (
    <scroll-view
      ref={ref}
      classList={[styles.contents, layoutClass]}
      data-section-id={id}
      tabindex={tabindex}
    >
      <If condition={showToolbar}>
        <Portal>
          <SectionToolbar section={section} />
        </Portal>
      </If>

      <Each items={tiles}>
        {(tile) => (
          <Item
            classList={{ [styles.item]: true }}
            editable={isEditable}
            tile={tile}
            tabindex={tabindex}
            resize={resize}
          />
        )}
      </Each>
    </scroll-view>
  );
}
