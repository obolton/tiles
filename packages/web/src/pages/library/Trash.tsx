import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Placeholder from "@/components/placeholder/Placeholder";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import DeletedPagesGrid from "@/components/grid/DeletedPagesGrid";
import type { AppRouterOutputs } from "@/api/client";

export interface TrashProps {
  pages: AppRouterOutputs["pages"]["listDeleted"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "There are no pages in the trash."}
    </Placeholder>
  );
}

export default function Trash({ pages }: TrashProps) {
  return (
    <PageLayout>
      <header className="default-width">
        <h1>Library</h1>
      </header>

      <main className="default-width">
        <ul className="tabs" role="navigation">
          <li>
            <a href="/library">
              <LibraryIcon aria-hidden="true" />
              Your pages
            </a>
          </li>
          <li>
            <a href="/library/shared">
              <PeopleIcon aria-hidden="true" />
              Shared with you
            </a>
          </li>
          <li>
            <a href="/library/bookmarks">
              <BookmarkIcon aria-hidden="true" />
              Bookmarks
            </a>
          </li>
          <li aria-selected="true">
            <a href="/library/trash">
              <TrashIcon aria-hidden="true" />
              Trash
            </a>
          </li>
        </ul>

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
      </main>
    </PageLayout>
  );
}
