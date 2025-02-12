import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useCallback, useState } from "react";
import styles from "./Grid.module.css";
import newIcon from "@/icons/new.svg";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import Search from "@/components/search/Search";

interface PagesGridProps {
  pages?: AppRouterOutputs["pages"]["list"];
}

export default function PagesGrid({ pages: initialPages }: PagesGridProps) {
  const [pages, setPages] = useState(initialPages?.pages ?? []);
  const [hasMore, setHasMore] = useState(initialPages?.hasMore ?? false);

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      try {
        const { pages: resultPages, hasMore } = await client.pages.list.query({
          query: query || undefined,
          offset,
        });
        if (offset === 0) {
          setPages(resultPages);
        } else {
          setPages((prevPages) => [...(prevPages ?? []), ...resultPages]);
        }
        setHasMore(hasMore);
      } catch (error) {
        handleError(error);
      }
    },
    300,
    [],
  );

  const createNewPage = useCallback(async () => {
    try {
      const { id } = await client.pages.create.mutate({ title: "New page" });
      window.open(`/pages/${id}?edit=true`);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const renderPlaceholder = useCallback(
    (query: string) => {
      if (query) {
        return <p>There are no results.</p>;
      }
      return (
        <>
          <p>Get started by creating your first page.</p>
          <div className={styles["placeholder-buttons"]}>
            <button
              className="floating"
              type="button"
              aria-label="New page"
              data-tooltip="Create a new page"
              onClick={createNewPage}
            >
              <img src={newIcon.src} alt="Plus icon" />
            </button>
          </div>
        </>
      );
    },
    [createNewPage],
  );

  return (
    <Search
      search={search}
      results={pages}
      hasMore={hasMore}
      placeholder="Search pages"
      render={(page) => (
        <PagesGridItem key={page.id}>
          <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
