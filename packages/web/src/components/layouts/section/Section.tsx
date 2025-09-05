import Canvas from "@/components/layouts/canvas/Canvas";
import { flag } from "@/utils/reactivity";
import SectionToolbar from "./SectionToolbar";
import styles from "./Section.module.css";
import type { SectionWithTiles } from "@/types/tiles";
import type Editor from "@/editor/Editor";

export interface SectionProps {
  editor: Editor;
  section: SectionWithTiles;
}

export default function Section({ editor, section }: SectionProps) {
  const hasFocus = flag(false);
  const { isEditable } = editor;

  const onFocus = () => hasFocus.on();
  const onBlur = () => hasFocus.off();

  const anchorName = `--section-${section.id}`;

  return (
    <section
      classList={{
        [styles.section]: true,
      }}
      style={{ anchorName }}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-section-id={section.id}
      data-animate-layout-id={section.id}
      on:focus={onFocus}
      on:blur={onBlur}
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
        sectionId={section.id}
        items={section.tiles}
      />
    </section>
  );
}
