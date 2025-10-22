import Item from "@/components/item/Item";
import { flag, Computed } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import { toCSSColor } from "@/utils/color";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import Editor from "@/editor/Editor";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Section.module.css";
import { SIZE_UNIT, LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import type ScrollView from "@/elements/scroll-view/ScrollView";
import type { PageItemEvent } from "@/elements/item/events";
import type SectionModel from "@/models/Section";

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface SectionProps {
  section: SectionModel;
  signal?: AbortSignal;
}

export default function Section({ section, signal }: SectionProps) {
  const {
    id,
    dimensions,
    width,
    height,
    layout,
    background,
    hide,
    tiles,
    editor,
  } = section;
  const { isEditable } = editor;
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

  function onResize(event: PageItemEvent) {
    width.value = Math.round(event.width / SIZE_UNIT);
    height.value = Math.round(event.height / SIZE_UNIT);
  }

  function onResizeEnd() {
    section.setSize(width.value, height.value);
  }

  function insertSection() {
    Editor.current.createSection({ afterSectionId: id }).catch(handleError);
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
    [dimensions, width, height] as const,
    (dimensionsValue, widthValue, heightValue) => {
      switch (dimensionsValue) {
        case "LANDSCAPE":
          return {
            width: LANDSCAPE_SIZE.width * SIZE_UNIT + "px",
            height: LANDSCAPE_SIZE.height * SIZE_UNIT + "px",
          };
        case "PORTRAIT":
          return {
            width: PORTRAIT_SIZE.width * SIZE_UNIT + "px",
            height: PORTRAIT_SIZE.height * SIZE_UNIT + "px",
          };
        case "CUSTOM":
          return {
            width: widthValue * SIZE_UNIT + "px",
            height: heightValue * SIZE_UNIT + "px",
          };
      }
    },
  );

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

  const show = new Computed(
    [isEditable, hide] as const,
    (isEditableValue, hideValue) => !hideValue || isEditableValue,
  );

  return (
    <If condition={show}>
      <section
        ref={sectionRef}
        classList={{
          [styles.section]: true,
          [styles.hide]: hide,
        }}
        style={containerStyle}
        tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
        data-section-id={id}
        data-drop={isEditable.derive((editable) =>
          editable ? "true" : undefined,
        )}
        on:focus={onFocus}
        on:focusout={onFocusOut}
      >
        <If condition={hasFocus}>
          <Portal>
            <SectionToolbar section={section} />
          </Portal>
        </If>

        <page-item
          className={styles.container}
          style={contentStyle}
          allowdrag={isEditable}
          resize={isEditable.derive((value) => (value ? "all" : null))}
          on:itemresize={onResize}
          on:itemresizeend={onResizeEnd}
        >
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
                  resize={resize}
                />
              )}
            </Each>
          </scroll-view>
        </page-item>

        <If condition={hasFocus}>
          <button
            type="button"
            classList={{ floating: true, small: true, [styles.insert]: true }}
            aria-label="Insert section"
            data-tooltip="Insert section"
            on:pointerdown={preventDefault}
            on:click={insertSection}
          >
            <NewIcon aria-hidden="true" />
          </button>
        </If>
      </section>
    </If>
  );
}
