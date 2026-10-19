import Each from "jsx/each";
import ProfileImage from "@/components/profile-image/ProfileImage";
import { getProfileImageUrl } from "@/utils/images";
import styles from "./ProfileImageStack.module.css";
import type { Peer } from "@/collaboration/Presence";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

const DEFAULT_MAX = 3;

export interface ProfileImageStackProps extends JSX.Attributes<"ul"> {
  peers: Reactive<readonly Peer[]>;
  max?: number;
  size?: "small" | "medium" | "large";
  bordered?: boolean;
  onSelect?: (peer: Peer) => void;
}

export default function ProfileImageStack({
  peers,
  max = DEFAULT_MAX,
  size,
  bordered = true,
  classList,
  onSelect,
  ...props
}: ProfileImageStackProps) {
  const visible = peers.derive((list) => list.slice(0, max));

  return (
    <ul classList={{ [styles.list]: true, ...classList }} {...props}>
      <Each items={visible}>
        {(peer) => {
          const image = (
            <ProfileImage
              imageUrl={peer.imageId ? getProfileImageUrl(peer.imageId) : null}
              name={peer.name}
              color={bordered ? peer.color : undefined}
              size={size}
            />
          );

          return (
            <li className={styles.item} data-tooltip={peer.name}>
              {onSelect ? (
                <button
                  type="button"
                  className={styles.button}
                  aria-label={peer.name}
                  on:click={() => onSelect(peer)}
                >
                  {image}
                </button>
              ) : (
                image
              )}
            </li>
          );
        }}
      </Each>

      {peers.derive((list) => {
        const count = list.length - max;
        return count > 0 ? (
          <li className={styles.overflow} aria-label={`${count} more`}>
            +{count}
          </li>
        ) : null;
      })}
    </ul>
  );
}
