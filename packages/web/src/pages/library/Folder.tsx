import client from "@/api/client";
import LibraryPage from "./LibraryPage";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

export interface FolderProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  id: string;
  name: string;
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["folders"]["listPages"];
  user: User;
}

export default function Folder({ workspace, id, name, folders, pages, user }: FolderProps) {
  return (
    <LibraryPage
      workspace={workspace}
      folders={folders}
      selectedFolderId={id}
      pages={pages}
      user={user}
      placeholder={`Search in ${name}`}
      emptyMessage="The folder is empty."
      search={(options) =>
        client.folders.listPages.query({ workspaceId: workspace.id, id, ...options })
      }
      draggable
      move
      trash
    />
  );
}
