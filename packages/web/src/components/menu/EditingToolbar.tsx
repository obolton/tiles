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

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setEditMode(event.currentTarget.checked),
    [],
  );

  return (
    <FloatingToolbar>
      <ul role="group">
        <li role="presentation">
          <label id="edit-label">
            <span>Edit</span>
            <input
              id="edit-switch"
              type="checkbox"
              role="switch"
              checked={isEditable}
              onChange={onChange}
            />
          </label>
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
