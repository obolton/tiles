import client from "@/api/client";
import PagesGridItem from "./PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Search from "@/components/search/Search";
import { handleError } from "@/utils/errors";
import { Store } from "@/utils/stores";
import { showToast } from "@/utils/toasts";
import styles from "./DeletedPagesGrid.module.css";
import type { ClientPageLink } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";

interface PagesSearchResults {
  pages: NonNullable<ClientPageLink["linkedPage"]>[];
  hasMore: boolean;
}

interface DeletedPagesGridProps {
  inputPlaceholder?: string;
  search: (query: string, offset: number) => Promise<PagesSearchResults>;
  pages?: PagesSearchResults;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function DeletedPagesGrid({
  inputPlaceholder,
  search,
  pages: initialPages,
  renderPlaceholder,
}: DeletedPagesGridProps) {
  const pages = new Store(initialPages?.pages ?? []);
  const hasMore = new Store(initialPages?.hasMore ?? false);

  const onSearch = async (query: string, offset: number = 0) => {
    try {
      const results = await search(query, offset);
      if (offset === 0) {
        pages.value = results.pages;
      } else {
        pages.value = [...pages.value, ...results.pages];
      }
      hasMore.value = results.hasMore;
    } catch (error) {
      handleError(error);
    }
  };

  const emptyTrash = async () => {
    await client.pages.emptyTrash.mutate();
    pages.value = [];
    showToast("The trash was emptied.", "success");
  };

  return (
    <>
      <aside className={styles.aside}>
        <p>Pages in the trash will be permanently deleted after 30 days.</p>
        <button type="button" className="secondary" onclick={emptyTrash}>
          Empty trash
        </button>
      </aside>

      <Search
        search={onSearch}
        results={pages}
        hasMore={hasMore}
        placeholder={inputPlaceholder}
        render={(page) => (
          <PagesGridItem>
            <PageLinkTile id={page.id} linkedPage={page} openInNewTab={false} />
          </PagesGridItem>
        )}
        renderPlaceholder={renderPlaceholder}
      />
    </>
  );
}
