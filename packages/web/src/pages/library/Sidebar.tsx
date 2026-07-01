import Folders from "@/components/folders/Folders";
import type { FoldersProps } from "@/components/folders/Folders";

export interface SidebarProps {
  workspace: { id: string; name: string };
  folders: FoldersProps["folders"];
  selectedFolderId: FoldersProps["selectedId"];
}

export default function Sidebar({ workspace, folders, selectedFolderId }: SidebarProps) {
  return <Folders workspaceId={workspace.id} selectedId={selectedFolderId} folders={folders} />;
}
