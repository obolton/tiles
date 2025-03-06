import { useCallback } from "react";
import removeIcon from "@/icons/remove.svg";
import type { User } from "@/types/collaboration";
import styles from "./PageAccessRow.module.css";

interface PageAccessRowProps {
  user: User;
  description?: string;
  showRemove?: boolean;
  onRemove: (user: User) => void;
}

export default function PageAccessRow({
  user,
  description,
  showRemove = false,
  onRemove,
}: PageAccessRowProps) {
  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onRemove(user);
    },
    [user, onRemove],
  );

  return (
    <li>
      <a href={`/profiles/${user.id}`} target="_blank">
        {user.imageUrl ? (
          <img
            className="profile-image small"
            src={user.imageUrl}
            alt={user.name}
          />
        ) : null}

        <div className={styles.details}>
          <span className={styles.name}>{user.name}</span>
          {description ? (
            <span className={styles.description}>{description}</span>
          ) : null}
        </div>

        {showRemove ? (
          <button
            className="floating xsmall"
            type="button"
            aria-label="Delete"
            onClick={handleDelete}
          >
            <img
              className="icon"
              src={removeIcon.src}
              alt="Remove"
              aria-hidden="true"
            />
          </button>
        ) : null}
      </a>
    </li>
  );
}
