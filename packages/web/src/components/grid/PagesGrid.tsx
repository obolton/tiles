import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import type InfiniteScroll from "@/components/InfiniteScroll";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";
import newIcon from "@/icons/new.svg";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { viewTransition } from "@/utils/transitions";

type Pages = AppRouterOutputs["pages"]["list"];
type Page = Pages["pages"][number];

function defaultRender(page: Page) {
  return <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />;
}

interface PagesGridProps {
  pages?: Pages;
  render?: (page: Page) => React.ReactNode;
}

export default function PagesGrid({
  pages: initialPages,
  render = defaultRender,
}: PagesGridProps) {
  const ref = useRef<InfiniteScroll>(null);
  const [isStale, setStale] = useState(false);
  const [isPending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState(initialPages?.pages ?? []);
  const [allowLoadMore, setAllowLoadMore] = useState(
    initialPages?.hasMore ?? true,
  );

  const list = useDebouncedCallback(
    async (offset: number = 0) => {
      if (isPending) {
        return;
      }
      setPending(true);
      const { pages: resultPages, hasMore } = await client.pages.list.query({
        offset,
      });
      viewTransition(() => {
        setPages((prevPages) => [...(prevPages ?? []), ...resultPages]);
        setAllowLoadMore(hasMore);
        setPending(false);
        setStale(false);
      });
    },
    300,
    [],
  );

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      if (isPending) {
        return;
      }
      if (!query) {
        list();
        return;
      }
      setPending(true);
      const { pages: resultPages, hasMore } = await client.pages.search.query({
        query,
        offset,
      });
      viewTransition(() => {
        setPages((prevPages) => [...(prevPages ?? []), ...resultPages]);
        setAllowLoadMore(hasMore);
        setPending(false);
        setStale(false);
      });
    },
    300,
    [],
  );

  const queryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value.trim();
      setQuery(query);
      setPages([]);
      setStale(true);
      search(query, 0);
    },
    [search],
  );

  const loadMore = useCallback(async () => {
    if (!allowLoadMore || isPending) {
      return;
    }
    if (query) {
      search(query, pages?.length ?? 0);
    } else {
      list(pages?.length ?? 0);
    }
  }, [allowLoadMore, isPending, list, pages?.length, query, search]);

  useEffect(() => {
    if (ref.current?.atEnd) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewPage = useCallback(() => {
    client.pages.create
      .mutate({ title: "New page" })
      .then(({ id }) => {
        window.open(`/pages/${id}?edit=true`);
      })
      .catch(handleError);
  }, []);

  return (
    <>
      <input
        id="search"
        autoFocus
        className={styles.search}
        type="search"
        placeholder="Search pages"
        onChange={queryChange}
      />

      <section className={styles.grid}>
        {(isPending || isStale) && pages.length === 0 && (
          <div className={styles.loading} />
        )}

        {!query && !isPending && !isStale && pages.length === 0 && (
          <div className={styles.placeholder}>
            <p>Get started by creating your first page.</p>
            <div className={styles["placeholder-buttons"]}>
              <button
                className="floating tooltip-bottom"
                type="button"
                aria-label="Create a new page"
                onClick={createNewPage}
              >
                <img src={newIcon.src} alt="Plus icon" />
              </button>
            </div>
          </div>
        )}

        {query && !isPending && !isStale && pages.length === 0 && (
          <div className={styles.placeholder}>
            <p>There are no results.</p>
          </div>
        )}

        <infinite-scroll ref={ref} onloadmore={loadMore}>
          {pages?.map((page) => {
            const item = render(page);
            if (!item) {
              return null;
            }
            return <PagesGridItem key={page.id}>{item}</PagesGridItem>;
          })}
        </infinite-scroll>
      </section>
    </>
  );
}
