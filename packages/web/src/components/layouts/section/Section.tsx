import Item from "@/components/item/Item";
import { flag, Computed } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import { toCSSColor } from "@/utils/color";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Editor from "@/editor/Editor";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Section.module.css";
import type { SectionWithTiles } from "@/types/tiles";
import type ScrollView from "@/elements/scroll-view/ScrollView";
import type { PageItemEvent } from "@/elements/item/events";

const SIZE_UNIT = 24;

export interface SectionProps {
  editor: Editor;
  section: SectionWithTiles;
  signal?: AbortSignal;
}

export default function Section({ editor, section, signal }: SectionProps) {
  const { isEditable } = editor;
  const { id, width, height, layout, background, tiles } = section;
  const hasFocus = flag(false);
  let scrollView: ScrollView | null = null;

  function sectionRef(element: HTMLElement) {
    if (!scrollView) {
      return;
    }
    new LayoutEditor({
      element: scrollView,
      grid: scrollView.contents,
      dropTarget: element,
      editor,
      sectionId: id,
      signal,
    });
  }

  function scrollViewRef(element: ScrollView) {
    scrollView = element;
  }

  function onFocusIn() {
    if (isEditable.value) {
      hasFocus.on();
    }
  }

  function onResize(event: PageItemEvent) {
    width.value = Math.round(event.width / SIZE_UNIT);
    height.value = Math.round(event.height / SIZE_UNIT);
  }

  function onResizeEnd() {
    Editor.current.updateSection({
      id,
      width: width.value,
      height: height.value,
    });
  }

  function onFocusOut(event: FocusEvent) {
    const element = event.currentTarget as HTMLElement;
    if (
      !(event.relatedTarget instanceof Element) ||
      !element.contains(event.relatedTarget)
    ) {
      hasFocus.off();
    }
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

  const containerStyle = new Computed(
    [background] as const,
    (backgroundValue) => ({
      "--background-color":
        backgroundValue && "color" in backgroundValue
          ? toCSSColor(backgroundValue.color)
          : "transparent",
      backgroundImage:
        backgroundValue && "imageUrl" in backgroundValue
          ? `url(${backgroundValue.imageUrl})`
          : undefined,
    }),
  );

  const contentStyle = new Computed(
    [width, height] as const,
    (widthValue, heightValue) => ({
      width: widthValue * SIZE_UNIT + "px",
      height: heightValue * SIZE_UNIT + "px",
    }),
  );

  return (
    <section
      ref={sectionRef}
      classList={{
        [styles.section]: true,
      }}
      style={containerStyle}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-section-id={id}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
      on:focusin={onFocusIn}
      on:focusout={onFocusOut}
    >
      <page-item
        className={styles.item}
        style={contentStyle}
        allowdrag={isEditable}
        allowresize={isEditable}
        on:itemresize={onResize}
        on:itemresizeend={onResizeEnd}
      >
        <If condition={hasFocus}>
          <SectionToolbar section={section} />
        </If>

        <scroll-view
          ref={scrollViewRef}
          classList={[styles.contents, layoutClass]}
        >
          <Each items={tiles}>
            {(tile) => (
              <Item
                editor={editor}
                id={tile.id}
                classList={{ [styles.item]: true }}
                placementId={tile.placementId}
                editable={isEditable}
                x={tile.x}
                y={tile.y}
                width={tile.width}
                height={tile.height}
                rowSpan={tile.rowSpan}
                block={tile.type === "TEXT" ? tile.block : undefined}
                tile={tile}
                tabIndex={isEditable.derive((editable) =>
                  editable ? 0 : undefined,
                )}
              />
            )}
          </Each>
        </scroll-view>
      </page-item>
    </section>
  );
}
