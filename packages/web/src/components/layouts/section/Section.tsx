import Item from "@/components/item/Item";
import { flag, Computed } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import Editor from "@/editor/Editor";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Section.module.css";
import type ScrollView from "@/elements/scroll-view/ScrollView";
import type SectionModel from "@/models/Section";

export interface SectionProps {
  section: SectionModel;
  signal?: AbortSignal;
}

export default function Section({ section, signal }: SectionProps) {
  const { id, layout, tiles, editor } = section;
  const { isEditable } = editor;
  const hasFocus = flag(false);

  function ref(element: ScrollView) {
    new LayoutEditor({
      element,
      grid: element.contents,
      layoutType: section.layout.value,
      dropTarget: element,
      editor,
      sectionId: id,
      signal,
    });
  }

  function onFocus() {
    if (isEditable.value) {
      hasFocus.on();
      Editor.current.activeSection = section;
    }
  }

  function onFocusOut(event: FocusEvent) {
    const { relatedTarget } = event;
    if (
      relatedTarget instanceof Element &&
      relatedTarget.closest(
        "dialog[open], [popover]:popover-open, floating-toolbar",
      )
    ) {
      return;
    }

    hasFocus.off();
    Editor.current.activeSection = null;
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

  const resize = new Computed(
    [isEditable, layout] as const,
    (isEditableValue, layoutValue) => {
      if (!isEditableValue) {
        return null;
      }

      switch (layoutValue) {
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
      on:focus={onFocus}
      on:focusout={onFocusOut}
    >
      <If condition={hasFocus}>
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
