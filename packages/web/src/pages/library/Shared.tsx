import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Placeholder from "@/components/placeholder/Placeholder";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import PagesGrid from "@/components/grid/PagesGrid";
import type { AppRouterOutputs } from "@/api/client";

export interface SharedProps {
  pages: AppRouterOutputs["pages"]["listShared"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query
        ? "There are no results."
        : "You haven't been shared any pages yet."}
    </Placeholder>
  );
}

export default function Shared({ pages }: SharedProps) {
  return (
    <PageLayout>
      <header>
        <h1>Library</h1>
      </header>

      <main>
        <ul class="tabs" role="navigation">
          <li>
            <a href="/library">
              <LibraryIcon aria-hidden="true" />
              Your pages
            </a>
          </li>
          <li aria-selected="true">
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
          <li>
            <a href="/library/trash">
              <TrashIcon aria-hidden="true" />
              Trash
            </a>
          </li>
        </ul>

        <PagesGrid
          inputPlaceholder="Search pages shared with you"
          pages={pages}
          search={(query, offset) =>
            client.pages.listShared.query({ query, offset })
          }
          renderPlaceholder={renderPlaceholder}
        />
      </main>
    </PageLayout>
  );
}
