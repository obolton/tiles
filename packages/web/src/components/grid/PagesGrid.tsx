import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import type InfiniteScroll from "@/components/InfiniteScroll";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";

type Pages = AppRouterOutputs["pages"]["getRecentWithTiles"];
type Page = Pages["pages"][number];

function defaultRender(page: Page) {
  return <PageLinkTile id={page.id} pageLink={{ pageId: page.id, page }} />;
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
  const [pages, setPages] = useState(initialPages?.pages);
  const loadingRef = useRef<boolean>(false);
  const [allowLoadMore, setAllowLoadMore] = useState(
    initialPages?.hasMore ?? true,
  );

  const loadMore = useCallback(async () => {
    if (!allowLoadMore || loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    const { pages: morePages, hasMore } =
      await client.pages.getRecentWithTiles.query({
        offset: pages?.length ?? 0,
      });
    loadingRef.current = false;
    setAllowLoadMore(hasMore);
    setPages((prevPages) => [...(prevPages ?? []), ...morePages]);
  }, [allowLoadMore, pages?.length]);

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
  }, [allowLoadMore, loadMore, pages?.length]);

  return (
    <section className={styles.grid}>
      <infinite-scroll ref={ref}>
        {pages?.map((page) => {
          const item = render(page);
          if (!item) {
            return null;
          }
          return <PagesGridItem key={page.id}>{item}</PagesGridItem>;
        })}
      </infinite-scroll>
    </section>
  );
}
