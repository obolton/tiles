import EditingTools from "./EditingTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import If from "@/jsx/if";
import { viewTransition } from "@/utils/transitions";
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
      isEditable.value = !isEditable.value;
    });
  }

  return (
    <floating-toolbar
      className="top-right"
      aria-label="Editing toolbar"
      data-tooltip-position="bottom"
    >
      <toolbar-tab className={styles.toolbar} label="Editing">
        <ToolbarGroup label="Editing mode">
          <button
            type="button"
            id="edit-button"
            className="primary"
            aria-pressed={isEditable}
            on:click={toggleEdit}
          >
            {isEditable.derive((editable) => (editable ? "Done" : "Edit"))}
          </button>
        </ToolbarGroup>

        <If condition={isEditable}>
          <EditingTools editor={editor} allowDelete={allowDelete} />
        </If>
      </toolbar-tab>
    </floating-toolbar>
  );
}
