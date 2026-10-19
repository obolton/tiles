import MailIcon from "@/icons/mail.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import Row from "@/components/rows/Row";
import CopyButton from "@/components/buttons/CopyButton";
import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./InviteRow.module.css";
import type { Invite } from "@/types/collaboration";

export interface InviteRowProps<T extends Invite> {
  invite: T;
  /** The link the invitee opens to accept the invite. */
  url: string;
  showRemoveButton?: boolean;
  onRemove?: (invite: T) => void;
}

export default function InviteRow<T extends Invite>({
  invite,
  url,
  showRemoveButton,
  onRemove,
}: InviteRowProps<T>) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  });

  return (
    <Row
      icon={invite.email ? <MailIcon aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}
      title={invite.email ?? "Invite link"}
      subtitle={`Created on ${formatter.format(new Date(invite.createdAt))}`}
      controls={
        <div className={styles.controls}>
          <CopyButton
            classList={{ small: true }}
            text={url}
            label="Copy invite link"
            message="Invite link copied"
          />
          {showRemoveButton ? (
            <button
              type="button"
              className="floating small"
              aria-label="Remove"
              on:click={onRemove ? () => onRemove(invite) : undefined}
            >
              <RemoveIcon aria-hidden="true" />
            </button>
          ) : null}
        </div>
      }
    />
  );
}
