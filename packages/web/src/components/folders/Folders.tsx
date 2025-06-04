import client from "@/api/client";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import FolderIcon from "@/icons/folder.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import { registerModal, showModal } from "@/utils/modals";
import { reactive } from "@/utils/reactivity";
import type { FolderModalResult } from "./FolderModal";
import styles from "./Folders.module.css";

export type SYSTEM_FOLDER = "RECENT" | "SHARED" | "BOOKMARKS" | "TRASH";

export interface Folder {
  id: string;
  name: string;
}

export interface FoldersProps {
  selectedId?: SYSTEM_FOLDER | (string & {});
  folders: {
    folders: Folder[];
    hasMore: boolean;
  };
}

registerModal("FOLDER", () => import("./FolderModal"));

export default function Folders({
  selectedId = "RECENT",
  folders: initialFolders,
}: FoldersProps) {
  const folders = reactive(initialFolders);

  function createFolder() {
    showModal<FolderModalResult>("FOLDER", {
      showDelete: false,
      async onConfirm(result) {
        if (result === "DELETE") {
          return;
        }
        const folder = await client.folders.create.mutate({
          name: result.name,
        });
        folders.value = {
          folders: folders.value.folders
            .concat(folder)
            .sort((a, b) => a.name.localeCompare(b.name)),
          hasMore: folders.value.hasMore,
        };
      },
    });
  }

  function ref(element: HTMLElement) {
    element.addEventListener("dnd-dragenter", (event) => {
      const item = event.target as HTMLElement;
      item.classList.add(styles["drag-over"]);
    });
    element.addEventListener("dnd-dragleave", (event) => {
      const item = event.target as HTMLElement;
      item.classList.remove(styles["drag-over"]);
    });
    element.addEventListener("dnd-drop", async (event) => {
      const item = event.target as HTMLElement;
      const id = item.dataset.id;
      const pageId = event.dragSource.dataset.id;
      if (!id || !pageId) {
        return;
      }
      await client.folders.movePage.mutate({ id, pageId });
    });
  }

  return (
    <nav className={styles.folders}>
      <ul ref={ref}>
        <li aria-selected={selectedId === "RECENT" ? "true" : "false"}>
          <a href="/library">
            <LibraryIcon aria-hidden="true" />
            <span>Your pages</span>
          </a>
        </li>
        <li aria-selected={selectedId === "SHARED" ? "true" : "false"}>
          <a href="/library/shared">
            <PeopleIcon aria-hidden="true" />
            Shared with you
          </a>
        </li>
        <li aria-selected={selectedId === "BOOKMARKS" ? "true" : "false"}>
          <a href="/library/bookmarks">
            <BookmarkIcon aria-hidden="true" />
            <span>Bookmarks</span>
          </a>
        </li>
        <li aria-selected={selectedId === "TRASH" ? "true" : "false"}>
          <a href="/library/trash">
            <TrashIcon aria-hidden="true" />
            <span>Trash</span>
          </a>
        </li>

        {folders.derive((value) =>
          value.folders.map((folder) => (
            <li
              aria-selected={selectedId === folder.id ? "true" : "false"}
              data-id={folder.id}
              data-drop="true"
            >
              <a href={`/library/${folder.id}`}>
                <FolderIcon aria-hidden="true" />
                <span>{folder.name}</span>
              </a>
            </li>
          )),
        )}

        <li className={styles.new}>
          <button type="button" onclick={createFolder}>
            <NewIcon aria-hidden="true" />
            <span>New folder</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
