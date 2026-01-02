import debounce from "@/utils/debounce";
import { reactive } from "@/utils/reactivity";
import styles from "./Search.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export interface SearchProps<T> {
  id: string;
  itemsClassName?: string;
  search: (query: string, cursor: string | null) => void | Promise<void>;
  results: Reactive<T[]>;
  nextCursor: Reactive<string | null | undefined>;
  placeholder?: string;
  autofocus?: boolean;
  render: (result: T) => JSX.Node;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function Search<T>({
  id,
  itemsClassName,
  search,
  results,
  nextCursor,
  placeholder,
  autofocus = true,
  render,
  renderPlaceholder,
}: SearchProps<T>) {
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

  return (
    <section>
      <input
        id={id}
        type="search"
        className={styles.search}
        autofocus={autofocus}
        placeholder={placeholder}
        on:input={onInput}
      />

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
