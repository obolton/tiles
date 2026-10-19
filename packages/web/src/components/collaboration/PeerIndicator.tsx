import If from "@/jsx/if";
import ProfileImageStack from "./ProfileImageStack";
import styles from "./PeerIndicator.module.css";
import type { Peer } from "@/collaboration/Presence";
import type { Reactive } from "reactivity";

export interface PeerIndicatorProps {
  peers: Reactive<readonly Peer[]>;
}

export default function PeerIndicator({ peers }: PeerIndicatorProps) {
  return (
    <If condition={peers.derive((list) => list.length > 0)}>
      <div
        className={styles.indicator}
        aria-hidden="true"
        style={peers.derive((list) => ({ "--peer-color": list[0]?.color }))}
      >
        <ProfileImageStack peers={peers} bordered={false} classList={{ [styles.stack]: true }} />
      </div>
    </If>
  );
}
