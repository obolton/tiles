import debounce from "@/utils/debounce";
import { reactive } from "@/utils/reactivity";
import styles from "./Search.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export interface SearchProps<T> {
  id: string;
  itemsClassName?: string;
  search: (query: string, offset: number) => void;
  results: Reactive<T[]>;
  hasMore: Reactive<boolean>;
  placeholder?: string;
  render: (result: T) => JSX.Node;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function Search<T>({
  id,
  itemsClassName,
  search,
  results,
  hasMore,
  placeholder,
  render,
  renderPlaceholder,
}: SearchProps<T>) {
  const query = reactive("");

  async function onLoadMore() {
    if (!hasMore.value) {
      return;
    }
    search(query.value, results.value.length);
  }

  const debouncedSearch = debounce(search, 250);

  function onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const queryString = input.value.trim();
    query.value = queryString;
    debouncedSearch(queryString, 0);
  }

  return (
    <section>
      <input
        id={id}
        type="search"
        className={styles.search}
        autofocus
        placeholder={placeholder}
        on:input={onInput}
      />

      <infinite-scroll className={itemsClassName} onloadmore={onLoadMore}>
        {results.derive((items) =>
          items.length === 0
            ? renderPlaceholder(query.value)
            : items.map(render),
        )}
      </infinite-scroll>
    </section>
  );
}
