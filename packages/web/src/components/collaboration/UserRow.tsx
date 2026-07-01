import Row from "@/components/rows/Row";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type { User } from "@/types/collaboration";

export interface UserRowProps {
  user: User;
  description?: string;
  showRemoveButton?: boolean;
  onRemove?: (user: User) => void;
}

export default function UserRow({
  user,
  description,
  showRemoveButton = false,
  onRemove,
}: UserRowProps) {
  return (
    <Row
      icon={
        user.imageUrl ? <img className="profile-image" src={user.imageUrl} alt={user.name} /> : null
      }
      title={user.name}
      subtitle={description}
      controls={
        showRemoveButton ? (
          <button
            type="button"
            className="floating small"
            aria-label="Remove"
            on:click={onRemove ? () => onRemove(user) : undefined}
          >
            <RemoveIcon aria-hidden="true" />
          </button>
        ) : null
      }
    />
  );
}
