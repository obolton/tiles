import Folders from "@/components/folders/Folders";
import type { FoldersProps } from "@/components/folders/Folders";

export interface SidebarProps {
  folders: FoldersProps["folders"];
  selectedFolderId: FoldersProps["selectedId"];
}

export default function Sidebar({ folders, selectedFolderId }: SidebarProps) {
  return (
    <>
      <header>
        <h1>Library</h1>
      </header>

      <Folders selectedId={selectedFolderId} folders={folders} />
    </>
  );
}
