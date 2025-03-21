import { useCallback } from "react";
import FloatingToolbar from "@/components/toolbars/FloatingToolbar";
import EditingTools from "./EditingTools";
import useEditable from "@/hooks/useEditable";
import { setEditMode } from "@/utils/edit";
import "./EditingToolbar.module.css";

interface EditingToolbarProps {
  isPublished: boolean;
  allowDelete?: boolean;
  allowPublish?: boolean;
}

export default function EditingToolbar({
  isPublished,
  allowDelete = true,
  allowPublish = true,
}: EditingToolbarProps) {
  const isEditable = useEditable();

  const onClickEdit = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const edit = event.currentTarget.ariaPressed !== "true";
      setEditMode(edit);
    },
    [],
  );

  return (
    <FloatingToolbar>
      <ul role="group">
        <li role="presentation">
          <button
            role="menuitem"
            id="edit-button"
            type="button"
            className="primary"
            aria-pressed={isEditable ? "true" : "false"}
            onClick={onClickEdit}
          >
            {isEditable ? "Done" : "Edit"}
          </button>
        </li>
      </ul>

      {isEditable ? (
        <EditingTools
          isPublished={isPublished}
          allowPublish={allowPublish}
          allowDelete={allowDelete}
        />
      ) : null}
    </FloatingToolbar>
  );
}
