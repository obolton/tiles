import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Search from "@/components/search/Search";
import { handleError } from "@/utils/errors";
import { reactive } from "@/utils/reactivity";
import type { PageLinkProperties } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";

interface PagesSearchResults {
  pages: NonNullable<PageLinkProperties["linkedPage"]>[];
  hasMore: boolean;
}

interface PagesGridProps {
  inputPlaceholder?: string;
  search: (query: string, offset: number) => Promise<PagesSearchResults>;
  pages?: PagesSearchResults;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function PagesGrid({
  inputPlaceholder,
  search,
  pages: initialPages,
  renderPlaceholder,
}: PagesGridProps) {
  const pages = reactive(initialPages?.pages ?? []);
  const hasMore = reactive(initialPages?.hasMore ?? false);

  const onSearch = async (query: string, offset: number = 0) => {
    try {
      if (!query) {
        pages.value = initialPages?.pages ?? [];
        hasMore.value = initialPages?.hasMore ?? false;
        return;
      }

      const results = await search(query, offset);
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

  return (
    <Search
      search={onSearch}
      results={pages}
      hasMore={hasMore}
      placeholder={inputPlaceholder}
      render={(page) => (
        <PagesGridItem>
          <PageLinkTile
            id={page.id}
            linkedPage={reactive(page)}
            openInNewTab={false}
          />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
