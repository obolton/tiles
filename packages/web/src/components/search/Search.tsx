import { useCallback, useEffect, useRef, useState } from "react";
import type InfiniteScroll from "@/elements/infiniteScroll/InfiniteScroll";
import styles from "./Search.module.css";
import { classNames } from "@/utils/css";

interface SearchProps<T> {
  itemsClassName?: string;
  search: (query: string, offset: number) => void;
  results: T[] | null;
  hasMore: boolean;
  placeholder?: string;
  render: (result: T) => React.ReactNode;
  renderPlaceholder: (query: string) => React.ReactNode;
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
  const ref = useRef<InfiniteScroll>(null);
  const [query, setQuery] = useState("");
  const [isPending, setPending] = useState(false);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || isPending) {
      return;
    }
    search(query, results?.length ?? 0);
  }, [hasMore, isPending, search, results?.length, query]);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value.trim();
      setQuery(query);
      setPending(true);
      search(query, 0);
    },
    [search],
  );

  useEffect(() => {
    if (results) {
      setPending(false);
    }
  }, [results]);

  useEffect(() => {
    if (results === null) {
      setPending(true);
    }
    if (results === null || ref.current?.atEnd) {
      onLoadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <input
        id="search"
        autoFocus
        type="search"
        placeholder={placeholder}
        onChange={onChange}
      />

      <infinite-scroll
        class={classNames(styles.items, itemsClassName)}
        ref={ref}
        onloadmore={onLoadMore}
      >
        {!isPending && results && results.length === 0
          ? renderPlaceholder(query)
          : null}

        {isPending ? <div className={styles.loading} /> : results?.map(render)}
      </infinite-scroll>
    </section>
  );
}
