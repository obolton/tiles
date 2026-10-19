import { usersCache } from "@/utils/cache";
import { getWorkspaceUsers } from "@/utils/users";
import type FilterSelect from "@/elements/filter-select/FilterSelect";
import { handleError } from "@/utils/errors";
import ListOption from "@/components/lists/ListOption";
import Each from "jsx/each";
import styles from "./MentionPicker.module.css";

export interface MentionPickerProps {
  onSelect: (userId: string, displayName: string) => void;
  onClose: () => void;
}

export default function MentionPicker({ onSelect, onClose }: MentionPickerProps) {
  getWorkspaceUsers().catch(handleError);

  function handleChange(event: Event) {
    const filterSelect = event.currentTarget as FilterSelect;
    const userId = filterSelect.value;
    if (!userId) {
      return;
    }

    const user = usersCache.getById(userId);
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
        <Each items={usersCache.items}>
          {(user) => (
            <ListOption
              value={user.id}
              label={user.name}
              icon={
                user.imageUrl ? <img className="profile-image" src={user.imageUrl} alt="" /> : null
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
