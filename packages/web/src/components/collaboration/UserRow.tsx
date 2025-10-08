import Row from "@/components/rows/Row";
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
      data={user}
      icon={
        user.imageUrl ? (
          <img className="profile-image" src={user.imageUrl} alt={user.name} />
        ) : null
      }
      title={user.name}
      subtitle={description}
      showRemoveButton={showRemoveButton}
      onRemove={onRemove}
    />
  );
}
