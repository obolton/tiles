import Canvas from "@/components/layouts/canvas/Canvas";
import { flag, Computed } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import { toCSSColor } from "@/utils/color";
import styles from "./Section.module.css";
import type { SectionWithTiles } from "@/types/tiles";
import type Editor from "@/editor/Editor";

export interface SectionProps {
  editor: Editor;
  section: SectionWithTiles;
}

export default function Section({ editor, section }: SectionProps) {
  const { isEditable } = editor;
  const { id, background, tiles } = section;
  const hasFocus = flag(false);
  const anchorName = `--section-${id}`;

  function onFocusIn() {
    if (isEditable.value) {
      hasFocus.on();
    }
  }

  function onFocusOut(event: FocusEvent) {
    const element = event.currentTarget as HTMLElement;
    if (
      event.relatedTarget instanceof Element &&
      element.contains(event.relatedTarget)
    ) {
      return;
    }
    hasFocus.off();
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
    anchorName,
  }));

  return (
    <section
      classList={{
        [styles.section]: true,
      }}
      style={style}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-section-id={id}
      data-animate-layout-id={id}
      on:focusin={onFocusIn}
      on:focusout={onFocusOut}
    >
      {hasFocus.derive((value) =>
        value ? (
          <SectionToolbar
            editor={editor}
            section={section}
            anchorName={anchorName}
          />
        ) : null,
      )}

      <Canvas
        editor={editor}
        isEditable={isEditable}
        sectionId={id}
        items={tiles}
      />
    </section>
  );
}
