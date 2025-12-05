import MailIcon from "@/icons/mail.svg?jsx";
import Row from "@/components/rows/Row";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type { Invite } from "@/types/collaboration";

export interface InviteRowProps<T extends Invite> {
  invite: T;
  showRemoveButton?: boolean;
  onRemove?: (invite: T) => void;
}

export default function InviteRow<T extends Invite>({
  invite,
  showRemoveButton,
  onRemove,
}: InviteRowProps<T>) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  });

  return (
    <Row
      icon={<MailIcon aria-hidden="true" />}
      title={invite.email}
      subtitle={`Sent on ${formatter.format(new Date(invite.createdAt))}`}
      controls={
        showRemoveButton ? (
          <button
            type="button"
            className="floating small"
            aria-label="Remove"
            on:click={onRemove ? () => onRemove(invite) : undefined}
          >
            <RemoveIcon aria-hidden="true" />
          </button>
        ) : null
      }
    />
  );
}
