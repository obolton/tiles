import client from "@/api/client";
import LibraryPage from "./LibraryPage";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

export interface BookmarksProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["bookmarks"]["list"];
  user: User;
}

export default function Bookmarks({ workspace, folders, pages, user }: BookmarksProps) {
  return (
    <LibraryPage
      workspace={workspace}
      folders={folders}
      selectedFolderId="BOOKMARKS"
      pages={pages}
      user={user}
      placeholder="Search bookmarks"
      emptyMessage="You don’t have any bookmarks."
      search={({ query, cursor }) => client.bookmarks.list.query({ query, cursor })}
      sortable={false}
      draggable
      bookmark
    />
  );
}
