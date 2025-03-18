import { useCallback } from "react";
import Section from "@/components/layouts/section/Section";
import Placeholder from "@/components/placeholder/Placeholder";
import useEditable from "@/hooks/useEditable";
import type { Layout } from "@/types/layout";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";
import styles from "./PageContents.module.css";
import { viewTransition } from "@/utils/transitions";

interface PageContentsProps {
  layout: Layout;
}

export default function PageContents({ layout }: PageContentsProps) {
  const isEditable = useEditable();
  const editor = useEditor();

  const addSection = useCallback(async () => {
    try {
      await editor.createSection(viewTransition);
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  return (
    <>
      {layout.length === 0 ? (
        <Placeholder>
          {isEditable
            ? "There’s nothing here yet. Get starting by adding a section."
            : "This page is empty."}
        </Placeholder>
      ) : (
        layout.map((section) => <Section key={section.id} section={section} />)
      )}

      {isEditable ? (
        <button
          type="button"
          className={styles.add}
          onClick={addSection}
          aria-label="Add a section"
          data-tooltip="Add a section"
        >
          <NewIcon aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
