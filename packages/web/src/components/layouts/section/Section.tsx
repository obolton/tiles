import Item from "@/components/item/Item";
import { flag, Computed } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import { toCSSColor } from "@/utils/color";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Section.module.css";
import type { SectionWithTiles } from "@/types/tiles";
import type Editor from "@/editor/Editor";
import type ScrollView from "@/elements/scroll-view/ScrollView";

export interface SectionProps {
  editor: Editor;
  section: SectionWithTiles;
  signal?: AbortSignal;
}

export default function Section({ editor, section, signal }: SectionProps) {
  const { isEditable } = editor;
  const { id, background, tiles } = section;
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

  function onFocusOut(event: FocusEvent) {
    const element = event.currentTarget as HTMLElement;
    if (
      !(event.relatedTarget instanceof Element) ||
      !element.contains(event.relatedTarget)
    ) {
      hasFocus.off();
    }
  }

  const style = new Computed([background] as const, (backgroundValue) => ({
    "--background-color":
      backgroundValue && "color" in backgroundValue
        ? toCSSColor(backgroundValue.color)
        : "transparent",
    backgroundImage:
      backgroundValue && "imageUrl" in backgroundValue
        ? `url(${backgroundValue.imageUrl})`
        : undefined,
  }));

  return (
    <section
      ref={sectionRef}
      classList={{
        [styles.section]: true,
      }}
      style={style}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-section-id={id}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
      on:focusin={onFocusIn}
      on:focusout={onFocusOut}
    >
      <If condition={hasFocus}>
        <SectionToolbar section={section} />
      </If>

      <scroll-view ref={scrollViewRef} className={styles.contents}>
        <Each items={tiles}>
          {(tile) => (
            <Item
              editor={editor}
              id={tile.id}
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
    </section>
  );
}
