import EditingTools from "./EditingTools";
import If from "@/jsx/if";
import { viewTransition } from "@/utils/transitions";
import { setEditMode } from "@/utils/edit";
import { classNames } from "@/utils/css";
import styles from "./EditingToolbar.module.css";
import type Editor from "@/editor/Editor";

export interface EditingToolbarProps {
  editor: Editor;
  allowDelete?: boolean;
}

export default function EditingToolbar({
  editor,
  allowDelete = true,
}: EditingToolbarProps) {
  const { isEditable } = editor;

  function toggleEdit() {
    viewTransition(() => {
      setEditMode(!isEditable.value);
      isEditable.value = !isEditable.value;
    });
  }

  return (
    <floating-toolbar
      className={classNames(styles.toolbar, "top-right")}
      aria-label="Editing toolbar"
      data-tooltip-position="bottom"
    >
      <ul role="group" aria-label="Editing mode">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            id="edit-button"
            className="primary"
            aria-pressed={isEditable}
            on:click={toggleEdit}
          >
            {isEditable.derive((editable) => (editable ? "Done" : "Edit"))}
          </button>
        </li>
      </ul>

      <If condition={isEditable}>
        <EditingTools editor={editor} allowDelete={allowDelete} />
      </If>
    </floating-toolbar>
  );
}
