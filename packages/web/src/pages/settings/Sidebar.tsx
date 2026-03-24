import ProfileIcon from "@/icons/profile.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import MailIcon from "@/icons/mail.svg?jsx";
import styles from "./Sidebar.module.css";

export type SettingsPage = "PROFILE" | "GENERAL" | "MEMBERS" | "INVITES";

export interface SidebarProps {
  workspaceId: string;
  page: SettingsPage;
  isAdmin?: boolean;
}

export default function Sidebar({
  workspaceId,
  page,
  isAdmin = false,
}: SidebarProps) {
  const base = `/workspaces/${workspaceId}/settings`;

  return (
    <nav>
      <ul className="navigation-menu">
        <li aria-current={page === "PROFILE" ? "page" : "false"}>
          <a href={`${base}/profile`}>
            <ProfileIcon aria-hidden="true" />
            <span>Profile</span>
          </a>
        </li>
      </ul>

      <h3 className={styles.heading}>Workspace</h3>

      <ul className="navigation-menu">
        <li aria-current={page === "GENERAL" ? "page" : "false"}>
          <a href={`${base}/workspace/general`}>
            <SettingsIcon aria-hidden="true" />
            <span>General</span>
          </a>
        </li>

        <li aria-current={page === "MEMBERS" ? "page" : "false"}>
          <a href={`${base}/workspace/members`}>
            <PeopleIcon aria-hidden="true" />
            <span>Members</span>
          </a>
        </li>

        {isAdmin ? (
          <li aria-current={page === "INVITES" ? "page" : "false"}>
            <a href={`${base}/workspace/invites`}>
              <MailIcon aria-hidden="true" />
              <span>Invites</span>
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
