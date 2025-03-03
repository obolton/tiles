import { useCallback, useState } from "react";
import Grid from "@/components/layouts/grid/Grid";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import Placeholder from "@/components/placeholder/Placeholder";
import TileButtons from "@/components/menu/TileButtons";
import useEditable from "@/hooks/useEditable";
import { useEditor } from "@/context/editor";
import { handleError } from "@/utils/errors";
import styles from "./Section.module.css";
import { classNames } from "@/utils/css";
import type { Section } from "@/types/layout";
import moreIcon from "@/icons/more.svg";
import trashIcon from "@/icons/trash.svg";

function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === "Enter" || event.key === "Escape") {
    event.currentTarget.blur();
    event.preventDefault();
  }
}

function GridPlaceholder({ collectionId }: { collectionId: string }) {
  const isEditable = useEditable();
  return (
    <Placeholder
      className={styles.placeholder}
      actions={
        isEditable ? (
          <TileButtons collectionId={collectionId} exclude={["SECTION"]} />
        ) : undefined
      }
    >
      There’s nothing here.
    </Placeholder>
  );
}

export interface SectionProps {
  section: Section;
}

export default function Section({ section }: SectionProps) {
  const editor = useEditor();
  const isEditable = useEditable();
  const [title, setTitle] = useState(section.title ?? "");

  const onChangeTitle = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setTitle(event.currentTarget.value.replace(/[\r\n]/g, "")),
    [],
  );

  const saveTitle = useCallback(async () => {
    try {
      await editor.updateCollection({ id: section.id, title });
    } catch (error) {
      handleError(error);
    }
  }, [editor, section.id, title]);

  const deleteSection = useCallback(async () => {
    try {
      await editor.deleteSection({ id: section.id });
    } catch (error) {
      handleError(error);
    }
  }, [editor, section.id]);

  return (
    <section className={styles.section} data-animate-layout-id={section.id}>
      {isEditable ? (
        <ResizingTextarea
          id={`${section.id}-heading`}
          className={classNames("editable", styles.title, styles.textarea)}
          placeholder="Heading"
          onChange={onChangeTitle}
          onBlur={saveTitle}
          onKeyDown={onKeyDown}
          value={title}
          data-heading="true"
        />
      ) : title ? (
        <h2 id={`${section.id}-heading`} className={styles.title}>
          {title}
        </h2>
      ) : null}

      <Grid
        collectionId={section.id}
        items={section.tiles}
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
            <img src={moreIcon.src} alt="Options" aria-hidden="true" />
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
                  <img
                    className="icon"
                    src={trashIcon.src}
                    alt="Delete"
                    aria-hidden="true"
                  />
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
