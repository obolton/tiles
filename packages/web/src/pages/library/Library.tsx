import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import Placeholder from "@/components/placeholder/Placeholder";
import LibraryIcon from "@/icons/library.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import PagesGrid from "@/components/grid/PagesGrid";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

export interface LibraryProps {
  pages: AppRouterOutputs["pages"]["list"];
}

async function createNewPage() {
  try {
    const { id } = await client.pages.create.mutate({ title: "New page" });
    window.open(`/pages/${id}?edit=true`);
  } catch (error) {
    handleError(error);
  }
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder
      actions={
        query ? undefined : (
          <button
            className="floating"
            type="button"
            aria-label="New page"
            data-tooltip="Create a new page"
            onclick={createNewPage}
          >
            <NewIcon aria-hidden="true" />
          </button>
        )
      }
    >
      {query
        ? "There are no results."
        : "Get started by creating your first page."}
    </Placeholder>
  );
}

export default function Library({ pages }: LibraryProps) {
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

        <PagesGrid
          inputPlaceholder="Search pages"
          pages={pages}
          search={(query, offset) => client.pages.list.query({ query, offset })}
          renderPlaceholder={renderPlaceholder}
        />
      </main>
    </PageLayout>
  );
}
