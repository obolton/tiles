import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./UserRow.module.css";
import type { User } from "@/types/collaboration";

export interface UserRowProps {
  user: User;
  description?: string;
  showRemove?: boolean;
  onRemove?: (user: User) => void;
}

export default function UserRow({
  user,
  description,
  showRemove = false,
  onRemove,
}: UserRowProps) {
  function onClickRemove() {
    onRemove?.(user);
  }

  return (
    <div className={styles.row}>
      {user.imageUrl ? (
        <img className="profile-image" src={user.imageUrl} alt={user.name} />
      ) : null}

      <div className={styles.details}>
        <span className={styles.name}>{user.name}</span>
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </div>

      {showRemove ? (
        <button
          type="button"
          className="floating xsmall"
          aria-label="Remove user"
          on:click={onClickRemove}
        >
          <RemoveIcon aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
