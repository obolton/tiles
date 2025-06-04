import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Folders from "@/components/folders/Folders";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import styles from "./Library.module.css";
import type { AppRouterOutputs } from "@/api/client";

export interface BookmarksProps {
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["bookmarks"]["list"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "You don’t have any bookmarks."}
    </Placeholder>
  );
}

export default function Bookmarks({ folders, pages }: BookmarksProps) {
  return (
    <PageLayout>
      <header className="default-width">
        <h1>Library</h1>
      </header>

      <main className={styles.contents}>
        <Folders selectedId="BOOKMARKS" folders={folders} />

        <section className={styles.pages}>
          <header>
            <h2>Bookmarks</h2>
          </header>

          <PagesGrid
            inputPlaceholder="Search bookmarks"
            pages={pages}
            search={(query, offset) =>
              client.bookmarks.list.query({ query: query || undefined, offset })
            }
            renderPlaceholder={renderPlaceholder}
            draggable
          />
        </section>
      </main>
    </PageLayout>
  );
}
