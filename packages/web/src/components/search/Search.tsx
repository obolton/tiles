import debounce from "@/utils/debounce";
import { reactive } from "@/utils/reactivity";
import SortIcon from "@/icons/sort.svg?jsx";
import styles from "./Search.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface SearchProps<T, S extends string = string> {
  id: string;
  itemsClassName?: string;
  search: (query: string, cursor: string | null) => void | Promise<void>;
  results: Reactive<T[]>;
  nextCursor: Reactive<string | null | undefined>;
  placeholder?: string;
  autofocus?: boolean;
  render: (result: T) => JSX.Node;
  renderPlaceholder: (query: string) => JSX.Node;
  sortOptions?: JSX.Node;
  sort?: Reactive<S>;
}

export default function Search<T, S extends string = string>({
  id,
  itemsClassName,
  search,
  results,
  nextCursor,
  placeholder,
  autofocus = true,
  render,
  renderPlaceholder,
  sortOptions,
  sort,
}: SearchProps<T, S>) {
  const query = reactive("");

  async function onLoadMore() {
    if (nextCursor.value === null) {
      return;
    }
    search(query.value, nextCursor.value ?? null);
  }

  const debouncedSearch = debounce(search, 250);

  function onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const queryString = input.value.trim();
    query.value = queryString;
    debouncedSearch(queryString, null);
  }

  function onSortChange(event: Event) {
    if (sort) {
      sort.value = (event.currentTarget as ListSelect).value as S;
      debouncedSearch(query.value, null);
    }
  }

  return (
    <section>
      <div className={styles.toolbar}>
        <input
          id={id}
          type="search"
          className={styles.search}
          autofocus={autofocus}
          placeholder={placeholder}
          on:input={onInput}
        />

        {sortOptions && sort && (
          <list-select
            aria-label="Sort by"
            orientation="vertical"
            data-tooltip="Sort by"
            showvalue
            value={sort}
            on:change={onSortChange}
          >
            <SortIcon slot="default-icon" aria-hidden="true" />
            {sortOptions}
          </list-select>
        )}
      </div>

      <infinite-scroll className={itemsClassName} on:loadmore={onLoadMore}>
        {results.derive((items) =>
          items.length === 0
            ? renderPlaceholder(query.value)
            : items.map(render),
        )}
      </infinite-scroll>
    </section>
  );
}
