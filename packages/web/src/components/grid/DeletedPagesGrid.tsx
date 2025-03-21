import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageTile from "@/components/tiles/PageTile";
import Placeholder from "@/components/placeholder/Placeholder";
import Search from "@/components/search/Search";
import { useCallback, useState, useTransition } from "react";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import styles from "./DeletedPagesGrid.module.css";
import { classNames } from "@/utils/css";

interface DeletedPagesGridProps {
  pages?: AppRouterOutputs["pages"]["listDeleted"];
}

export default function DeletedPagesGrid({
  pages: initialPages,
}: DeletedPagesGridProps) {
  const [isPending, startTransition] = useTransition();
  const [pages, setPages] = useState(initialPages?.pages ?? []);
  const [hasMore, setHasMore] = useState(initialPages?.hasMore ?? false);

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      try {
        const { pages: resultPages, hasMore } =
          await client.pages.listDeleted.query({
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

  const renderPlaceholder = useCallback(
    (query: string) => (
      <Placeholder>
        {query ? "There are no results." : "There are no pages in the trash."}
      </Placeholder>
    ),
    [],
  );

  const emptyTrash = useCallback(() => {
    startTransition(async () => {
      await client.pages.emptyTrash.mutate();
      setPages([]);
    });
  }, []);

  return (
    <>
      <aside className={styles.aside}>
        <p>Pages in the trash will be permanently deleted after 30 days.</p>

        <button
          type="button"
          className={classNames("secondary", isPending && "pending")}
          onClick={emptyTrash}
        >
          Empty trash
        </button>
      </aside>

      <Search
        search={search}
        results={pages}
        hasMore={hasMore}
        placeholder="Search trash"
        render={(page) => (
          <PagesGridItem key={page.id}>
            <PageTile
              title={page.title}
              subtitle={page.subtitle}
              author={page.author}
              hue={page.hue}
              font={page.font}
              theme={page.theme}
              coverImageUrl={page.coverImageUrl}
            />
          </PagesGridItem>
        )}
        renderPlaceholder={renderPlaceholder}
      />
    </>
  );
}
