import MailIcon from "@/icons/mail.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./InviteRow.module.css";
import type { Invite } from "@/types/collaboration";

export interface InviteRowProps {
  invite: Invite;
  showRemove?: boolean;
  onRemove?: (invite: Invite) => void;
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export default function InviteRow({
  invite,
  showRemove,
  onRemove,
}: InviteRowProps) {
  function onClickRemove() {
    onRemove?.(invite);
  }

  return (
    <div className={styles.row}>
      <MailIcon aria-hidden="true" />

      <div className={styles.details}>
        <span className={styles.email}>{invite.email}</span>
        <span className={styles.description}>
          Sent on {formatter.format(new Date(invite.createdAt))}
        </span>
      </div>

      {showRemove ? (
        <button
          type="button"
          className="floating xsmall"
          aria-label="Revoke invite"
          data-tooltip="Revoke invite"
          on:click={onClickRemove}
        >
          <RemoveIcon aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
