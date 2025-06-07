import ProfileIcon from "@/icons/profile.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";

export interface SidebarProps {
  page: "PROFILE" | "WORKSPACE";
}

export default function Sidebar({ page }: SidebarProps) {
  return (
    <>
      <header>
        <h1>Settings</h1>
      </header>

      <nav>
        <ul className="navigation-menu">
          <li aria-current={page === "PROFILE" ? "page" : "false"}>
            <a href="/settings/profile">
              <ProfileIcon aria-hidden="true" />
              <span>Profile</span>
            </a>
          </li>

          <li aria-current={page === "WORKSPACE" ? "page" : "false"}>
            <a href="/settings/workspace">
              <WorkspaceIcon aria-hidden="true" />
              <span>Workspace</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
