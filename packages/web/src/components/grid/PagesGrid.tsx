import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import type InfiniteScroll from "@/components/InfiniteScroll";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";
import newIcon from "@/icons/new.svg";
import { handleError } from "@/utils/errors";

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
    const { pages: morePages, hasMore } = await client.pages.list.query({
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

  const createNewPage = useCallback(() => {
    client.pages.create
      .mutate({ title: "New page" })
      .then(({ id }) => {
        window.open(`/pages/${id}?edit=true`);
      })
      .catch(handleError);
  }, []);

  return (
    <section className={styles.grid}>
      {pages?.length === 0 && (
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
  );
}
