import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Placeholder from "@/components/placeholder/Placeholder";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import PagesGrid from "@/components/grid/PagesGrid";
import type { AppRouterOutputs } from "@/api/client";

export interface BookmarksProps {
  pages: AppRouterOutputs["bookmarks"]["list"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "You don’t have any bookmarks."}
    </Placeholder>
  );
}

export default function Bookmarks({ pages }: BookmarksProps) {
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
          <li aria-selected="true">
            <a href="/library/bookmarks">
              <BookmarkIcon aria-hidden="true" />
              Bookmarks
            </a>
          </li>
          <li>
            <a href="/library/trash">
              <TrashIcon aria-hidden="true" />
              Trash
            </a>
          </li>
        </ul>

        <PagesGrid
          inputPlaceholder="Search bookmarks"
          pages={pages}
          search={(query, offset) =>
            client.bookmarks.list.query({ query: query || undefined, offset })
          }
          renderPlaceholder={renderPlaceholder}
        />
      </main>
    </PageLayout>
  );
}
