import NavigationMenu from "./NavigationMenu";
import NewPageMenu from "./NewPageMenu";
import styles from "./Header.module.css";
import type { User } from "@/utils/sessions";
import type { JSX } from "jsx/jsx";

export interface HeaderProps {
  user: User;
  workspaceId: string;
  center?: JSX.Node;
  actions?: JSX.Node;
  /**
   * Prioritize wide center content (such as a search box or page title): it takes the
   * remaining width on tablets and moves onto its own row on phones.
   */
  stacked?: boolean;
}

export default function Header({ user, workspaceId, center, actions, stacked }: HeaderProps) {
  return (
    <header
      id="header"
      classList={{ [styles.header]: true, [styles.stacked]: stacked }}
      data-tooltip-position="bottom"
    >
      <nav className={styles.start} aria-label="Navigation">
        <NavigationMenu user={user} workspaceId={workspaceId} />
        <NewPageMenu workspaceId={workspaceId} />
      </nav>

      <div className={styles.center}>{center}</div>

      <div className={styles.end} role="toolbar" aria-label="Page actions">
        {actions}
      </div>
    </header>
  );
}
