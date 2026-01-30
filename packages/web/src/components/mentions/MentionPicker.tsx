import { getWorkspaceUsers, type WorkspaceUser } from "@/utils/users";
import type FilterSelect from "@/elements/filter-select/FilterSelect";
import { reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import ListOption from "@/components/lists/ListOption";
import Each from "@/jsx/each";
import styles from "./MentionPicker.module.css";

export interface MentionPickerProps {
  onSelect: (userId: string, displayName: string) => void;
  onClose: () => void;
}

export default function MentionPicker({
  onSelect,
  onClose,
}: MentionPickerProps) {
  const users = reactive<WorkspaceUser[]>([]);

  getWorkspaceUsers()
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

  function handleToggle(event: ToggleEvent) {
    if (event.newState === "closed") {
      onClose();
    }
  }

  return (
    <div className={styles.container}>
      <filter-select
        className={styles.picker}
        placeholder="Search people..."
        popover="auto"
        on:change={handleChange}
        on:toggle={handleToggle}
      >
        <Each items={users}>
          {(user) => (
            <ListOption
              value={user.id}
              label={user.name}
              icon={
                user.imageUrl ? (
                  <img className="profile-image" src={user.imageUrl} alt="" />
                ) : null
              }
            >
              {user.name}
            </ListOption>
          )}
        </Each>
      </filter-select>
    </div>
  );
}
