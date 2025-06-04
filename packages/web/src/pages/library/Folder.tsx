import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Folders from "@/components/folders/Folders";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import SettingsIcon from "@/icons/settings.svg?jsx";
import styles from "./Library.module.css";
import { showModal } from "@/utils/modals";
import { redirectWithToast } from "@/utils/toasts";
import type { AppRouterOutputs } from "@/api/client";
import type { FolderModalResult } from "@/components/folders/FolderModal";

export interface FolderProps {
  id: string;
  name: string;
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["folders"]["listPages"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "The folder is empty."}
    </Placeholder>
  );
}

export default function Folder({ id, name, folders, pages }: FolderProps) {
  function editFolder() {
    showModal<FolderModalResult>("FOLDER", {
      showDelete: true,
      name,
      async onConfirm(result) {
        if (result === "DELETE") {
          await client.folders.delete.mutate({
            id,
          });
          redirectWithToast("/library", "The folder was deleted.", "success");
          return;
        }
        await client.folders.update.mutate({
          id,
          name: result.name,
        });
      },
    });
  }

  return (
    <PageLayout>
      <header className="default-width">
        <h1>Library</h1>
      </header>

      <main className={styles.contents}>
        <Folders selectedId={id} folders={folders} />

        <section className={styles.pages}>
          <header>
            <h2>{name}</h2>
            <button
              type="button"
              className="floating small"
              aria-label="Folder settings"
              data-tooltip="Folder settings"
              onclick={editFolder}
            >
              <SettingsIcon aria-hidden="true" />
            </button>
          </header>

          <PagesGrid
            inputPlaceholder={`Search in ${name}`}
            pages={pages}
            search={(query, offset) =>
              client.folders.listPages.query({
                id,
                query: query || undefined,
                offset,
              })
            }
            renderPlaceholder={renderPlaceholder}
            draggable
          />
        </section>
      </main>
    </PageLayout>
  );
}
