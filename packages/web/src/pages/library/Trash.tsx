import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Folders from "@/components/folders/Folders";
import Placeholder from "@/components/placeholder/Placeholder";
import DeletedPagesGrid from "@/components/grid/DeletedPagesGrid";
import styles from "./Library.module.css";
import type { AppRouterOutputs } from "@/api/client";

export interface TrashProps {
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listDeleted"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "There are no pages in the trash."}
    </Placeholder>
  );
}

export default function Trash({ folders, pages }: TrashProps) {
  return (
    <PageLayout>
      <header className="default-width">
        <h1>Library</h1>
      </header>

      <main className={styles.contents}>
        <Folders selectedId="TRASH" folders={folders} />

        <section className={styles.pages}>
          <header>
            <h2>Trash</h2>
          </header>

          <DeletedPagesGrid
            inputPlaceholder="Search trash"
            pages={pages}
            search={(query, offset) =>
              client.pages.listDeleted.query({
                query: query || undefined,
                offset,
              })
            }
            renderPlaceholder={renderPlaceholder}
          />
        </section>
      </main>
    </PageLayout>
  );
}
