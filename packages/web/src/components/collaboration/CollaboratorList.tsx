import Each from "@/jsx/each";
import ProfileImage from "@/components/profile-image/ProfileImage";
import { getProfileImageUrl } from "@/utils/images";
import styles from "./CollaboratorList.module.css";
import type Presence from "@/collaboration/Presence";

const MAX_VISIBLE = 3;

export interface CollaboratorListProps {
  presence: Presence;
}

export default function CollaboratorList({ presence }: CollaboratorListProps) {
  const visible = presence.derive((peers) => peers.slice(0, MAX_VISIBLE));

  return (
    <ul className={styles.list} aria-label="Collaborators">
      <Each items={visible}>
        {(peer) => (
          <li
            className={styles.item}
            aria-label={peer.name}
            data-tooltip={peer.name}
          >
            <ProfileImage
              imageUrl={peer.imageId ? getProfileImageUrl(peer.imageId) : null}
              name={peer.name}
              color={peer.color}
            />
          </li>
        )}
      </Each>

      {presence.derive((peers) => {
        const count = peers.length - MAX_VISIBLE;
        return count > 0 ? (
          <li className={styles.overflow} aria-label={`${count} more`}>
            +{count}
          </li>
        ) : null;
      })}
    </ul>
  );
}
