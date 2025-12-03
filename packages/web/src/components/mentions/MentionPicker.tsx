import { getWorkspaceUsers, type WorkspaceUser } from "@/utils/users";
import type FilterSelect from "@/elements/filter-select/FilterSelect";
import { reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import Each from "@/jsx/each";
import styles from "./MentionPicker.module.css";

export interface MentionPickerProps {
  workspaceId: string;
  onSelect: (userId: string, displayName: string) => void;
  onClose: () => void;
}

export default function MentionPicker({
  workspaceId,
  onSelect,
  onClose,
}: MentionPickerProps) {
  const users = reactive<WorkspaceUser[]>([]);

  getWorkspaceUsers(workspaceId)
    .then((result) => {
      users.value = result.users;
    })
    .catch(handleError);

  function handleChange(event: Event) {
    const filterSelect = event.currentTarget as FilterSelect;
    const userId = filterSelect.value;
    if (!userId) {
      return;
    }

    const user = users.value.find((u) => u.id === userId);
    if (user) {
      onSelect(user.id, user.name);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className={styles.container}>
      <filter-select
        className={styles.picker}
        placeholder="Search people..."
        on:change={handleChange}
        on:keydown={handleKeyDown}
      >
        <Each items={users}>
          {(user) => (
            <button type="button" className="menuitem" data-value={user.id}>
              {user.imageUrl ? (
                <img className="profile-image" src={user.imageUrl} alt="" />
              ) : null}
              <span className={styles.name}>{user.name}</span>
            </button>
          )}
        </Each>
      </filter-select>
    </div>
  );
}
