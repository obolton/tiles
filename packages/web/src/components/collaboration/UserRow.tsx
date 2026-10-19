import Row from "@/components/rows/Row";
import ProfileImage from "@/components/profile-image/ProfileImage";
import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./UserRow.module.css";
import type { User } from "@/types/collaboration";
import type { Reactive } from "reactivity";

export interface UserRowProps {
  user: User;
  description?: string | Reactive<string>;
  online?: Reactive<boolean>;
  showRemoveButton?: boolean;
  onRemove?: (user: User) => void;
}

export default function UserRow({
  user,
  description,
  online,
  showRemoveButton = false,
  onRemove,
}: UserRowProps) {
  return (
    <Row
      icon={
        <ProfileImage
          imageUrl={user.imageUrl}
          name={user.name}
          size="medium"
          classList={{ [styles.online]: online ?? false }}
        />
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
