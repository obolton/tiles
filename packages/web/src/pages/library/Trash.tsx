import client from "@/api/client";
import LibraryPage, { type LibraryPageState } from "./LibraryPage";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import If from "jsx/if";
import styles from "./Trash.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

export interface TrashProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listDeleted"];
  user: User;
}

export default function Trash({ workspace, folders, pages, user }: TrashProps) {
  async function emptyTrash({ pages, cursor }: LibraryPageState) {
    try {
      await client.pages.emptyTrash.mutate({ workspaceId: workspace.id });
      pages.value = [];
      cursor.value = null;
      showToast("The trash was emptied.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <LibraryPage
      workspace={workspace}
      folders={folders}
      selectedFolderId="TRASH"
      pages={pages}
      user={user}
      placeholder="Search trash"
      emptyMessage="There are no pages in the trash."
      search={(options) =>
        client.pages.listDeleted.query({ workspaceId: workspace.id, ...options })
      }
      link={false}
      restore
      renderActions={(state) => (
        <button type="button" className="secondary" on:click={() => emptyTrash(state)}>
          Empty trash
        </button>
      )}
      renderBefore={({ pages }) => (
        <If condition={pages.derive((p) => p.length > 0)}>
          <aside className={styles.aside}>
            <p>Pages in the trash will be permanently deleted after 30 days.</p>
          </aside>
        </If>
      )}
    />
  );
}
