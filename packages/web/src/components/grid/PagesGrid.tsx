import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import type InfiniteScroll from "@/components/InfiniteScroll";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";

interface PagesGridProps {
  pages: AppRouterOutputs["pages"]["getRecentWithTiles"];
}

export default function PagesGrid({ pages: initialPages }: PagesGridProps) {
  const ref = useRef<InfiniteScroll>(null);
  const [pages, setPages] = useState(initialPages.pages);
  const loadingRef = useRef<boolean>(false);
  const [allowLoadMore, setAllowLoadMore] = useState(initialPages.hasMore);

  const loadMore = useCallback(async () => {
    if (!allowLoadMore || loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    const { pages: morePages, hasMore } =
      await client.pages.getRecentWithTiles.query({
        offset: pages.length,
      });
    loadingRef.current = false;
    setAllowLoadMore(hasMore);
    setPages((prevPages) => [...prevPages, ...morePages]);
  }, [allowLoadMore, pages.length]);

  useEffect(() => {
    if (ref.current?.atEnd) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const infiniteScroll = ref.current;
    if (!infiniteScroll) {
      return;
    }
    infiniteScroll.addEventListener("load-more", loadMore);
    return () => {
      infiniteScroll.removeEventListener("load-more", loadMore);
    };
  }, [allowLoadMore, loadMore, pages.length]);

  return (
    <section className={styles.grid}>
      <infinite-scroll ref={ref}>
        {pages.map((page, i) => (
          <PageLinkTile
            key={page.id}
            tile={{
              position: i,
              id: "",
              rows: 1,
              columns: 1,
              type: "PAGE_LINK",
              pageLink: { pageId: page.id, page },
            }}
          />
        ))}
      </infinite-scroll>
    </section>
  );
}
