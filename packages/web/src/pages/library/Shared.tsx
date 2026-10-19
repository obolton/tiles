import client from "@/api/client";
import LibraryPage from "./LibraryPage";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

export interface SharedProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listShared"];
  user: User;
}

export default function Shared({ workspace, folders, pages, user }: SharedProps) {
  return (
    <LibraryPage
      workspace={workspace}
      folders={folders}
      selectedFolderId="SHARED"
      pages={pages}
      user={user}
      placeholder="Search pages shared with you"
      emptyMessage="You haven't been shared any pages yet."
      search={(options) => client.pages.listShared.query({ workspaceId: workspace.id, ...options })}
      draggable
      move
    />
  );
}
