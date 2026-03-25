import NavigationMenu from "./NavigationMenu";
import styles from "./Header.module.css";
import type { User } from "@/utils/sessions";
import type { JSX } from "@/jsx/jsx";

export interface HeaderProps {
  user: User;
  workspaceId: string;
  center?: JSX.Node;
  actions?: JSX.Node;
}

export default function Header({
  user,
  workspaceId,
  center,
  actions,
}: HeaderProps) {
  return (
    <header
      id="header"
      className={styles.header}
      data-tooltip-position="bottom"
    >
      <nav className={styles.start} aria-label="Navigation">
        <NavigationMenu user={user} workspaceId={workspaceId} />
      </nav>

      <div className={styles.center}>{center}</div>

      <div className={styles.end} role="toolbar" aria-label="Page actions">
        {actions}
      </div>
    </header>
  );
}
