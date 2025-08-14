import EditingTools from "./EditingTools";
import { viewTransition } from "@/utils/transitions";
import { setEditMode } from "@/utils/edit";
import styles from "./EditingToolbar.module.css";
import type Editor from "@/editor/Editor";

interface EditingToolbarProps {
  editor: Editor;
  allowDelete?: boolean;
  allowPublish?: boolean;
}

export default function EditingToolbar({
  editor,
  allowDelete = true,
  allowPublish = true,
}: EditingToolbarProps) {
  const { isEditable, isPublished } = editor;

  function toggleEdit() {
    viewTransition(() => {
      setEditMode(!isEditable.value);
      isEditable.value = !isEditable.value;
    });
  }

  return (
    <floating-toolbar
      className={styles.toolbar}
      aria-label="Editing toolbar"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="Editing mode">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            id="edit-button"
            className="primary"
            aria-pressed={isEditable.derive((editable) =>
              editable ? "true" : "false",
            )}
            on:click={toggleEdit}
          >
            {isEditable.derive((editable) => (editable ? "Done" : "Edit"))}
          </button>
        </li>
      </ul>

      {isEditable.derive((editable) =>
        editable ? (
          <EditingTools
            editor={editor}
            isPublished={isPublished}
            allowPublish={allowPublish}
            allowDelete={allowDelete}
          />
        ) : null,
      )}
    </floating-toolbar>
  );
}
