import client from "@/api/client";
import LibraryPage from "./LibraryPage";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

export interface LibraryProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["list"];
  user: User;
}

export default function Library({ workspace, folders, pages, user }: LibraryProps) {
  return (
    <LibraryPage
      workspace={workspace}
      folders={folders}
      selectedFolderId="RECENT"
      pages={pages}
      user={user}
      placeholder="Search pages"
      emptyMessage="Get started by creating your first page."
      search={(options) => client.pages.list.query({ workspaceId: workspace.id, ...options })}
      draggable
      move
      trash
    />
  );
}
