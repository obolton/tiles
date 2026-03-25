import LibraryCard from "@/components/library/LibraryCard";
import LibrarySelectionToolbar from "@/components/library/LibrarySelectionToolbar";
import If from "@/jsx/if";
import Search from "@/components/search/Search";
import ListGroup from "@/components/lists/ListGroup";
import ListOption from "@/components/lists/ListOption";
import { handleError } from "@/utils/errors";
import { set } from "@/utils/reactivity";
import styles from "./PagesGrid.module.css";
import type { LibraryPage } from "@/components/library/LibraryCard";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

interface PagesSearchResults {
  pages: LibraryPage[];
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
  workspaceId: string;
  query: Reactive<string>;
  pages: Reactive<LibraryPage[]>;
  cursor: Reactive<string | null>;
  search: (query: string, cursor: string | null) => Promise<PagesSearchResults>;
  renderPlaceholder: (query: string) => JSX.Node;
  draggable?: boolean;
  link?: boolean;
  sort?: Reactive<PageSort>;
  move?: boolean;
  trash?: boolean;
  restore?: boolean;
}

export default function PagesGrid({
  workspaceId,
  query,
  pages,
  cursor,
  search,
  renderPlaceholder,
  draggable,
  link,
  sort,
  move,
  trash,
  restore,
}: PagesGridProps) {
  const selection = set<string>();
  const hasSelection = selection.derive((ids) => ids.size > 0);

  const onSearch = async (query: string, searchCursor: string | null) => {
    try {
      const results = await search(query, searchCursor);
      if (!searchCursor) {
        pages.value = results.pages;
      } else {
        pages.value = [...pages.value, ...results.pages];
      }
      cursor.value = results.nextCursor;
    } catch (error) {
      handleError(error);
    }
  };

  function onRefresh() {
    selection.clear();
    onSearch("", null);
  }

  if (!import.meta.env.SSR) {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        selection.replace(pages.value.map((page) => page.id));
      }

      if (event.key === "Escape") {
        selection.clear();
      }
    });
  }

  return (
    <>
      <Search
        itemsClassName={styles.pages}
        search={onSearch}
        results={pages}
        nextCursor={cursor}
        query={query}
        sort={sort}
        render={(page) => (
          <LibraryCard
            page={page}
            selected={selection.derive((ids) => ids.has(page.id))}
            onToggle={() => selection.toggle(page.id)}
            draggable={draggable}
            link={link}
          />
        )}
        renderPlaceholder={renderPlaceholder}
      />

      <If condition={hasSelection}>
        <LibrarySelectionToolbar
          workspaceId={workspaceId}
          selection={selection}
          move={move}
          trash={trash}
          restore={restore}
          onComplete={onRefresh}
        />
      </If>
    </>
  );
}
