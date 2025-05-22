import Grid from "@/components/layouts/grid/Grid";
import Placeholder from "@/components/placeholder/Placeholder";
import { handleError } from "@/utils/errors";
import styles from "./Section.module.css";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { layoutTransition } from "@/utils/animation/layout";
import { flag } from "@/utils/reactivity";
import type { Section } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

function GridPlaceholder() {
  return <Placeholder className={styles.placeholder} />;
}

export interface SectionProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  section: Section;
}

export default function Section({ editor, isEditable, section }: SectionProps) {
  const hasFocus = flag(false);

  const deleteSection = async () => {
    try {
      await editor.deleteSection({ id: section.id }, layoutTransition);
    } catch (error) {
      handleError(error);
    }
  };

  const onFocus = () => {
    hasFocus.on();
    editor.focusedTile.value = section.id;
  };

  const onBlur = () => {
    hasFocus.off();
    editor.focusedTile.value = null;
  };

  return (
    <section
      className={styles.section}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-animate-layout-id={section.id}
      onfocus={onFocus}
      onblur={onBlur}
    >
      <Grid
        editor={editor}
        isEditable={isEditable}
        collectionId={section.id}
        items={section.tiles}
        columns={6}
        minColumnSpan={2}
        minRowSpan={1}
        Placeholder={GridPlaceholder}
      />

      {hasFocus.derive((value) =>
        value ? (
          <floating-toolbar
            data-tooltip-position="top"
            aria-label="Section toolbar"
          >
            <button
              role="menuitem"
              type="button"
              id={`${section.id}-options-button`}
              className="floating small"
              popoverTarget={`${section.id}-options`}
              aria-label="More options"
              data-tooltip="More options"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <MoreIcon aria-hidden="true" />
            </button>
            <popover-menu
              id={`${section.id}-options`}
              anchor={`${section.id}-options-button`}
            >
              <menu>
                <li>
                  <button
                    className="destructive"
                    type="button"
                    onclick={deleteSection}
                  >
                    <TrashIcon aria-hidden="true" />
                    Delete section
                  </button>
                </li>
              </menu>
            </popover-menu>
          </floating-toolbar>
        ) : null,
      )}
    </section>
  );
}
