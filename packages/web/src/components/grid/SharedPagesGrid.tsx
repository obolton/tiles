import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Placeholder from "@/components/placeholder/Placeholder";
import Search from "@/components/search/Search";
import { useCallback, useState } from "react";
import { handleError } from "@/utils/errors";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";

interface SharedPagesGridProps {
  pages?: AppRouterOutputs["pages"]["listShared"];
}

export default function SharedPagesGrid({
  pages: initialPages,
}: SharedPagesGridProps) {
  const [pages, setPages] = useState(initialPages?.pages ?? []);
  const [hasMore, setHasMore] = useState(initialPages?.hasMore ?? false);

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      try {
        const { pages: resultPages, hasMore } =
          await client.pages.listShared.query({
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
        {query
          ? "There are no results."
          : "You haven't been shared any pages yet."}
      </Placeholder>
    ),
    [],
  );

  return (
    <Search
      search={search}
      results={pages}
      hasMore={hasMore}
      placeholder="Search pages shared with you"
      render={(page) => (
        <PagesGridItem key={page.id}>
          <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />
        </PagesGridItem>
      )}
      renderPlaceholder={renderPlaceholder}
    />
  );
}
