import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import DeletedPage from "./DeletedPage";
import Placeholder from "@/components/placeholder/Placeholder";
import Search from "@/components/search/Search";
import { useCallback, useState, useTransition } from "react";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { showToast } from "@/utils/toasts";
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
  const [hasQuery, setHasQuery] = useState(false);

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
        setHasQuery(!!query);
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
      showToast("The trash was emptied.", "success");
    });
  }, []);

  return (
    <>
      {!hasQuery && pages.length > 0 ? (
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
            render={(page) => <DeletedPage key={page.id} {...page} />}
            renderPlaceholder={renderPlaceholder}
          />
        </>
      ) : (
        <aside>
          <p>The trash is empty.</p>
        </aside>
      )}
    </>
  );
}
