import { useCallback } from "react";
import mailIcon from "@/icons/mail.svg";
import removeIcon from "@/icons/remove.svg";
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
  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onRemove(invite);
    },
    [invite, onRemove],
  );

  return (
    <li>
      <span>
        <img
          className="icon"
          src={mailIcon.src}
          alt="Invitation"
          aria-hidden="true"
        />

        <div className={styles.details}>
          <span className={styles.email}>{invite.email}</span>
          <span className={styles.description}>Invitation sent</span>
        </div>

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
      </span>
    </li>
  );
}
