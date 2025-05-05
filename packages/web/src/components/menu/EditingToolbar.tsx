import FloatingToolbar from "@/components/toolbars/FloatingToolbar";
import EditingTools from "./EditingTools";
import "./EditingToolbar.module.css";
import { viewTransition } from "@/utils/transitions";
import type { Store } from "@/utils/stores";
import type Editor from "@/editor/Editor";
import { setEditMode } from "@/utils/edit";

interface EditingToolbarProps {
  editor: Editor;
  isEditable: Store<boolean>;
  isPublished: Store<boolean>;
  allowDelete?: boolean;
  allowPublish?: boolean;
}

export default function EditingToolbar({
  editor,
  isEditable,
  isPublished,
  allowDelete = true,
  allowPublish = true,
}: EditingToolbarProps) {
  const onClickEdit = (event: MouseEvent) => {
    const button = event.currentTarget as HTMLButtonElement;
    const edit = button.ariaPressed !== "true";
    viewTransition(() => {
      setEditMode(edit);
      isEditable.value = edit;
    });
  };

  return (
    <FloatingToolbar>
      <ul role="group">
        <li role="presentation">
          <button
            role="menuitem"
            id="edit-button"
            type="button"
            className="primary"
            aria-pressed={isEditable.derive((editable) =>
              editable ? "true" : "false",
            )}
            onclick={onClickEdit}
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
    </FloatingToolbar>
  );
}
