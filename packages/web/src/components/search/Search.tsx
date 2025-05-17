import { classNames } from "@/utils/css";
import { ReactiveValue } from "@/utils/reactivity";
import debounce from "@/utils/debounce";
import styles from "./Search.module.css";
import type { JSX } from "@/jsx/jsx";

export interface SearchProps<T> {
  itemsClassName?: string;
  search: (query: string, offset: number) => void;
  results: ReactiveValue<T[]>;
  hasMore: ReactiveValue<boolean>;
  placeholder?: string;
  render: (result: T) => JSX.Node;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function Search<T>({
  itemsClassName,
  search,
  results,
  hasMore,
  placeholder,
  render,
  renderPlaceholder,
}: SearchProps<T>) {
  const query = new ReactiveValue("");

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
    <section className={styles.search}>
      <input
        id="search"
        type="search"
        autofocus
        placeholder={placeholder}
        oninput={onInput}
      />

      <infinite-scroll
        className={classNames(styles.items, itemsClassName)}
        onloadmore={onLoadMore}
      >
        {results.derive((items) =>
          items.length === 0
            ? renderPlaceholder(query.value)
            : items.map(render),
        )}
      </infinite-scroll>
    </section>
  );
}
