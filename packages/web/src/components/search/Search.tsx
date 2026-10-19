import debounce from "@/utils/debounce";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";

export interface SearchProps<T, S extends string = string> {
  itemsClassName?: string;
  search: (query: string, cursor: string | null) => void | Promise<void>;
  results: Reactive<T[]>;
  nextCursor: Reactive<string | null | undefined>;
  render: (result: T) => JSX.Node;
  renderPlaceholder: (query: string) => JSX.Node;
  query: Reactive<string>;
  sort?: Reactive<S>;
}

export default function Search<T, S extends string = string>({
  itemsClassName,
  search,
  results,
  nextCursor,
  render,
  renderPlaceholder,
  query,
  sort,
}: SearchProps<T, S>) {
  const debouncedSearch = debounce(search, 250);

  function onLoadMore() {
    if (nextCursor.value === null) {
      return;
    }
    void search(query.value, nextCursor.value ?? null);
  }

  if (!import.meta.env.SSR) {
    query.subscribe(() => debouncedSearch(query.value, null));
    sort?.subscribe(() => debouncedSearch(query.value, null));
  }

  return (
    <infinite-scroll className={itemsClassName} on:loadmore={onLoadMore}>
      {results.derive((items) =>
        items.length === 0 ? renderPlaceholder(query.value) : items.map(render),
      )}
    </infinite-scroll>
  );
}
