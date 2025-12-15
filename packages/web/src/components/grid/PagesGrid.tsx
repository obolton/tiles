import PagesGridItem from "./PagesGridItem";
import PageLink from "@/components/tiles/PageLink";
import Search from "@/components/search/Search";
import { handleError } from "@/utils/errors";
import { reactive } from "@/utils/reactivity";
import styles from "./PagesGrid.module.css";
import type { ClientPageLinkTile } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";

interface PagesSearchResults {
  pages: NonNullable<ClientPageLinkTile["linkedPage"]>[];
  nextCursor: string | null;
}

interface PagesGridProps {
  inputPlaceholder?: string;
  search: (query: string, cursor: string | null) => Promise<PagesSearchResults>;
  pages?: PagesSearchResults;
  renderPlaceholder: (query: string) => JSX.Node;
  draggable?: boolean;
}

export default function PagesGrid({
  inputPlaceholder,
  search,
  pages: initialPages,
  renderPlaceholder,
  draggable,
}: PagesGridProps) {
  // TODO: Lift reactive pages list out of component
  const pages = reactive(initialPages?.pages ?? []);
  const nextCursor = reactive(initialPages?.nextCursor ?? null);

  const onSearch = async (query: string, cursor: string | null) => {
    try {
      if (!query && !cursor) {
        pages.value = initialPages?.pages ?? [];
        nextCursor.value = initialPages?.nextCursor ?? null;
        return;
      }

      const results = await search(query, cursor);
      if (!cursor) {
        pages.value = results.pages;
      } else {
        pages.value = [...pages.value, ...results.pages];
      }
      nextCursor.value = results.nextCursor;
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Search
      id="search-pages"
      itemsClassName={styles.pages}
      search={onSearch}
      results={pages}
      nextCursor={nextCursor}
      placeholder={inputPlaceholder}
      render={(page) => (
        <PagesGridItem id={page.id} draggable={draggable}>
          <PageLink
            pageId={page.id}
            title={page.title}
            background={page.background}
            font={page.font}
          />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
