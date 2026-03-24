import client from "@/api/client";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import FolderIcon from "@/icons/folder.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import { showModal } from "@/utils/modals";
import { reactive } from "@/utils/reactivity";
import { invalidateWorkspaceFolders } from "@/utils/folders";
import { redirectWithToast } from "@/utils/toasts";
import styles from "./Folders.module.css";
import type { DragDropEvent } from "@/utils/drag";

export type SYSTEM_FOLDER = "RECENT" | "SHARED" | "BOOKMARKS" | "TRASH";

export interface Folder {
  id: string;
  name: string;
}

export interface FoldersProps {
  workspaceId: string;
  selectedId?: SYSTEM_FOLDER | (string & {});
  folders: {
    folders: Folder[];
    nextCursor: string | null;
  };
}

const FolderModalLoader = () =>
  import("@/components/modals/folders/FolderModal");

export default function Folders({
  workspaceId,
  selectedId = "RECENT",
  folders: initialFolders,
}: FoldersProps) {
  const folders = reactive(initialFolders);

  function createFolder() {
    showModal(FolderModalLoader, {
      props: {
        showDelete: false,
      },
      async onConfirm(result) {
        if (result === "DELETE") {
          return;
        }
        const folder = await client.folders.create.mutate({
          workspaceId,
          name: result.name,
        });
        invalidateWorkspaceFolders();
        folders.value = {
          folders: folders.value.folders
            .concat(folder)
            .sort((a, b) => a.name.localeCompare(b.name)),
          nextCursor: folders.value.nextCursor,
        };
      },
    });
  }

  function editFolder(folder: Folder) {
    showModal(FolderModalLoader, {
      props: {
        name: folder.name,
        showDelete: true,
      },
      async onConfirm(result) {
        if (result === "DELETE") {
          await client.folders.delete.mutate({
            workspaceId,
            id: folder.id,
          });
          folders.value = {
            folders: folders.value.folders.filter((f) => f.id !== folder.id),
            nextCursor: folders.value.nextCursor,
          };
          if (selectedId === folder.id) {
            redirectWithToast(
              `/workspaces/${workspaceId}`,
              "The folder was deleted.",
              "success",
            );
          }
          return;
        }
        await client.folders.update.mutate({
          workspaceId,
          id: folder.id,
          name: result.name,
        });
        invalidateWorkspaceFolders();
      },
    });
  }

  async function onDrop(event: DragDropEvent) {
    const item = event.target as HTMLElement;
    const folderId = item.dataset.id;
    const pageId = event.dragSource.dataset.id;
    if (!folderId || !pageId) {
      return;
    }
    await client.pages.move.mutate({
      workspaceId,
      pageIds: [pageId],
      folderId,
    });
  }

  const basePath = `/workspaces/${workspaceId}`;

  return (
    <nav>
      <ul className="navigation-menu" on:dnd-drop={onDrop}>
        <li aria-current={selectedId === "RECENT" ? "page" : "false"}>
          <a href={basePath}>
            <LibraryIcon aria-hidden="true" />
            <span>Your pages</span>
          </a>
        </li>
        <li aria-current={selectedId === "SHARED" ? "page" : "false"}>
          <a href={`${basePath}/shared`}>
            <PeopleIcon aria-hidden="true" />
            Shared with you
          </a>
        </li>
        <li aria-current={selectedId === "BOOKMARKS" ? "page" : "false"}>
          <a href={`${basePath}/bookmarks`}>
            <BookmarkIcon aria-hidden="true" />
            <span>Bookmarks</span>
          </a>
        </li>
        <li aria-current={selectedId === "TRASH" ? "page" : "false"}>
          <a href={`${basePath}/trash`}>
            <TrashIcon aria-hidden="true" />
            <span>Trash</span>
          </a>
        </li>

        {folders.derive((value) =>
          value.folders.map((folder) => (
            <li
              className={styles.folder}
              aria-current={selectedId === folder.id ? "page" : "false"}
              data-id={folder.id}
              data-drop="true"
            >
              <a href={`${basePath}/folders/${folder.id}`}>
                <FolderIcon aria-hidden="true" />
                <span>{folder.name}</span>
              </a>
              <button
                type="button"
                classList={{
                  floating: true,
                  small: true,
                  [styles.settings]: true,
                }}
                aria-label="Folder settings"
                data-tooltip="Folder settings"
                on:click={() => editFolder(folder)}
              >
                <SettingsIcon aria-hidden="true" />
              </button>
            </li>
          )),
        )}

        <li className="muted">
          <button type="button" on:click={createFolder}>
            <NewIcon aria-hidden="true" />
            <span>New folder</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
