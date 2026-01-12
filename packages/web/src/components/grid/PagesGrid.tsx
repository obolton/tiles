import PagesGridItem from "./PagesGridItem";
import PageLink from "@/components/tiles/PageLink";
import Search from "@/components/search/Search";
import ListGroup from "@/components/lists/ListGroup";
import ListOption from "@/components/lists/ListOption";
import { handleError } from "@/utils/errors";
import { reactive } from "@/utils/reactivity";
import styles from "./PagesGrid.module.css";
import type { ClientPageLinkTile } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

interface PagesSearchResults {
  pages: NonNullable<ClientPageLinkTile["linkedPage"]>[];
  nextCursor: string | null;
}

export type PageSort =
  | "updatedAt:desc"
  | "updatedAt:asc"
  | "createdAt:desc"
  | "createdAt:asc"
  | "title:asc"
  | "title:desc";

export function PageSortOptions() {
  return (
    <>
      <ListGroup label="Date">
        <ListOption value="updatedAt:desc">Last updated</ListOption>
        <ListOption value="createdAt:desc">Newest first</ListOption>
        <ListOption value="createdAt:asc">Oldest first</ListOption>
      </ListGroup>
      <ListGroup label="Title">
        <ListOption value="title:asc">Title (A-Z)</ListOption>
        <ListOption value="title:desc">Title (Z-A)</ListOption>
      </ListGroup>
    </>
  );
}

export function parsePageSort(sort: PageSort) {
  const [sortBy, sortDirection] = sort.split(":") as [
    "updatedAt" | "createdAt" | "title",
    "asc" | "desc",
  ];
  return { sortBy, sortDirection };
}

interface PagesGridProps {
  inputPlaceholder?: string;
  search: (query: string, cursor: string | null) => Promise<PagesSearchResults>;
  pages?: PagesSearchResults;
  renderPlaceholder: (query: string) => JSX.Node;
  draggable?: boolean;
  sort?: Reactive<PageSort>;
}

export default function PagesGrid({
  inputPlaceholder,
  search,
  pages: initialPages,
  renderPlaceholder,
  draggable,
  sort,
}: PagesGridProps) {
  // TODO: Lift reactive pages list out of component
  const pages = reactive(initialPages?.pages ?? []);
  const nextCursor = reactive(initialPages?.nextCursor ?? null);

  const onSearch = async (query: string, cursor: string | null) => {
    try {
      if (!query && !cursor && !sort) {
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
      sortOptions={sort ? <PageSortOptions /> : undefined}
      sort={sort}
      render={(page) => (
        <PagesGridItem id={page.id} draggable={draggable}>
          <PageLink
            pageId={page.id}
            title={page.title}
            background={page.background}
          />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
