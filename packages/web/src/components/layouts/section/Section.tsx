import Grid from "@/components/layouts/grid/Grid";
import Placeholder from "@/components/placeholder/Placeholder";
import { handleError } from "@/utils/errors";
import styles from "./Section.module.css";
import { classNames } from "@/utils/css";
import type { Section } from "@/types/tiles";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { layoutTransition } from "@/utils/animation/layout";
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
  const deleteSection = async () => {
    try {
      await editor.deleteSection({ id: section.id }, layoutTransition);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <section className={styles.section} data-animate-layout-id={section.id}>
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

      {isEditable.derive((editable) =>
        editable ? (
          <>
            <button
              id={`${section.id}-options-button`}
              className={classNames("floating", styles.options)}
              type="button"
              popoverTarget={`${section.id}-options`}
              aria-label="Section options"
              aria-haspopup="menu"
              aria-expanded="false"
              data-tooltip="Section options"
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
          </>
        ) : null,
      )}
    </section>
  );
}
