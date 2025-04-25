import { classNames } from "@/utils/css";
import { Store } from "@/utils/stores";
import styles from "./Search.module.css";
import type { JSX } from "@/jsx/jsx";

export interface SearchProps<T> {
  itemsClassName?: string;
  search: (query: string, offset: number) => void;
  results: Store<T[]>;
  hasMore: Store<boolean>;
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
  const query = new Store("");

  async function onLoadMore() {
    if (!hasMore.value) {
      return;
    }
    search(query.value, results.value.length);
  }

  function onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const queryString = input.value.trim();
    query.value = queryString;
    search(queryString, 0);
  }

  return (
    <section className={styles.search}>
      <input
        id="search"
        type="search"
        autoFocus
        placeholder={placeholder}
        oninput={onInput}
      />

      <infinite-scroll
        class={classNames(styles.items, itemsClassName)}
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
