import { useCallback } from "react";
import Grid from "@/components/layouts/grid/Grid";
import Placeholder from "@/components/placeholder/Placeholder";
import useEditable from "@/hooks/useEditable";
import { useEditor } from "@/context/editor";
import { handleError } from "@/utils/errors";
import styles from "./Section.module.css";
import { classNames } from "@/utils/css";
import type { Section } from "@/types/layout";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { layoutTransition } from "@/utils/animation/layout";

function GridPlaceholder() {
  return <Placeholder className={styles.placeholder} />;
}

export interface SectionProps {
  section: Section;
}

export default function Section({ section }: SectionProps) {
  const editor = useEditor();
  const isEditable = useEditable();

  const deleteSection = useCallback(async () => {
    try {
      await editor.deleteSection({ id: section.id }, layoutTransition);
    } catch (error) {
      handleError(error);
    }
  }, [editor, section.id]);

  return (
    <section className={styles.section} data-animate-layout-id={section.id}>
      <Grid
        collectionId={section.id}
        items={section.tiles}
        columns={6}
        minColumnSpan={2}
        minRowSpan={1}
        Placeholder={GridPlaceholder}
      />

      {isEditable ? (
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
                  onClick={deleteSection}
                >
                  <TrashIcon aria-hidden="true" />
                  Delete section
                </button>
              </li>
            </menu>
          </popover-menu>
        </>
      ) : null}
    </section>
  );
}
