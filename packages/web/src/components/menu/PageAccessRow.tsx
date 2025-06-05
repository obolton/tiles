import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./PageAccessRow.module.css";
import type { User } from "@/types/collaboration";

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
  const handleDelete = (event: MouseEvent) => {
    event.preventDefault();
    onRemove(user);
  };

  return (
    <li>
      <span>
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
            className="floating xsmall"
            type="button"
            aria-label="Delete"
            onClick={handleDelete}
          >
            <RemoveIcon aria-hidden="true" />
          </button>
        ) : null}
      </span>
    </li>
  );
}
