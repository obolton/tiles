import ProfileIcon from "@/icons/profile.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";

export interface SidebarProps {
  workspaceId: string;
  page: "PROFILE" | "WORKSPACE";
}

export default function Sidebar({ workspaceId, page }: SidebarProps) {
  return (
    <>
      <header>
        <h1>Settings</h1>
      </header>

      <nav>
        <ul className="navigation-menu">
          <li aria-current={page === "PROFILE" ? "page" : "false"}>
            <a href={`/workspaces/${workspaceId}/settings/profile`}>
              <ProfileIcon aria-hidden="true" />
              <span>Profile</span>
            </a>
          </li>

          <li aria-current={page === "WORKSPACE" ? "page" : "false"}>
            <a href={`/workspaces/${workspaceId}/settings/workspace`}>
              <WorkspaceIcon aria-hidden="true" />
              <span>Workspace</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
