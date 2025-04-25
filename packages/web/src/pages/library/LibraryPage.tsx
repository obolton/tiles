import PageLayout from "@/layouts/PageLayout";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import PagesGrid from "@/components/grid/PagesGrid";
import type { AppRouterOutputs } from "@/api/client";

export interface LibraryPageProps {
  pages: AppRouterOutputs["pages"]["list"];
}

export default function LibraryPage({ pages }: LibraryPageProps) {
  return (
    <PageLayout>
      <header>
        <h1>Library</h1>
      </header>

      <main>
        <ul class="tabs" role="navigation">
          <li aria-selected="true">
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
          <li>
            <a href="/library/trash">
              <TrashIcon aria-hidden="true" />
              Trash
            </a>
          </li>
        </ul>

        <PagesGrid pages={pages} />
      </main>
    </PageLayout>
  );
}
