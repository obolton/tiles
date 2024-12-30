import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { useState } from "react";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import Search from "@/components/search/Search";

interface PagesGridProps {
  pages?: AppRouterOutputs["bookmarks"]["list"];
}

export default function PagesGrid({ pages: initialPages }: PagesGridProps) {
  const [pages, setPages] = useState(initialPages?.pages ?? []);
  const [hasMore, setHasMore] = useState(initialPages?.hasMore ?? false);

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      try {
        const { pages: resultPages, hasMore } =
          await client.bookmarks.list.query({
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

  return (
    <Search
      search={search}
      results={pages}
      hasMore={hasMore}
      placeholder="Search bookmarks"
      render={(page) => (
        <PagesGridItem key={page.id}>
          <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />
        </PagesGridItem>
      )}
      renderPlaceholder={(query: string) =>
        query ? (
          <p>There are no results.</p>
        ) : (
          <p>You don’t have any bookmarks.</p>
        )
      }
    />
  );
}
