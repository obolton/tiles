import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Placeholder from "@/components/placeholder/Placeholder";
import Search from "@/components/search/Search";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { Store } from "@/utils/stores";
import type { AppRouterOutputs } from "@/api/client";

interface PagesGridProps {
  pages?: AppRouterOutputs["pages"]["list"];
}

async function createNewPage() {
  try {
    const { id } = await client.pages.create.mutate({ title: "New page" });
    window.open(`/pages/${id}?edit=true`);
  } catch (error) {
    handleError(error);
  }
}

export default function PagesGrid({ pages: initialPages }: PagesGridProps) {
  const pages = new Store(initialPages?.pages ?? []);
  const hasMore = new Store(initialPages?.hasMore ?? false);

  const search = async (query: string, offset: number = 0) => {
    try {
      const results = await client.pages.list.query({
        query: query || undefined,
        offset,
      });
      if (offset === 0) {
        pages.value = results.pages;
      } else {
        pages.value = [...pages.value, ...results.pages];
      }
      hasMore.value = results.hasMore;
    } catch (error) {
      handleError(error);
    }
  };

  const renderPlaceholder = (query: string) => (
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

  return (
    <Search
      search={search}
      results={pages}
      hasMore={hasMore}
      placeholder="Search pages"
      render={(page) => (
        <PagesGridItem>
          <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
