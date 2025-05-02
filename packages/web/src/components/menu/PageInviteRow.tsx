import MailIcon from "@/icons/mail.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./PageInviteRow.module.css";
import type { PageInvite } from "@/types/collaboration";

interface PageInviteRowProps {
  invite: PageInvite;
  onRemove: (access: PageInvite) => void;
}

export default function PageInviteRow({
  invite,
  onRemove,
}: PageInviteRowProps) {
  const handleDelete = (event: MouseEvent) => {
    event.preventDefault();
    onRemove(invite);
  };

  return (
    <li className={styles.row}>
      <span>
        <MailIcon aria-hidden="true" />

        <div className={styles.details}>
          <span className={styles.email}>{invite.email}</span>
          <span className={styles.description}>Invitation sent</span>
        </div>

        <button
          className="floating xsmall"
          type="button"
          aria-label="Delete"
          onclick={handleDelete}
        >
          <RemoveIcon aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
