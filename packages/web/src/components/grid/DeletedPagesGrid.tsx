import client from "@/api/client";
import DeletedPage from "./DeletedPage";
import Search from "@/components/search/Search";
import { handleError } from "@/utils/errors";
import { reactive } from "@/utils/reactivity";
import { showToast } from "@/utils/toasts";
import styles from "./DeletedPagesGrid.module.css";
import type { ClientPageLinkTile } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";

interface PagesSearchResults {
  pages: NonNullable<ClientPageLinkTile["linkedPage"]>[];
  hasMore: boolean;
}

export interface DeletedPagesGridProps {
  workspaceId: string;
  inputPlaceholder?: string;
  search: (query: string, offset: number) => Promise<PagesSearchResults>;
  pages?: PagesSearchResults;
  renderPlaceholder: (query: string) => JSX.Node;
}

export default function DeletedPagesGrid({
  workspaceId,
  inputPlaceholder,
  search,
  pages: initialPages,
  renderPlaceholder,
}: DeletedPagesGridProps) {
  const pages = reactive(initialPages?.pages ?? []);
  const hasMore = reactive(initialPages?.hasMore ?? false);

  const onSearch = async (query: string, offset: number = 0) => {
    try {
      if (!query) {
        pages.value = initialPages?.pages ?? [];
        hasMore.value = initialPages?.hasMore ?? false;
        return;
      }

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
    await client.pages.emptyTrash.mutate({ workspaceId });
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
        id="search-pages"
        itemsClassName={styles.pages}
        search={onSearch}
        results={pages}
        hasMore={hasMore}
        placeholder={inputPlaceholder}
        render={(page) => <DeletedPage workspaceId={workspaceId} {...page} />}
        renderPlaceholder={renderPlaceholder}
      />
    </>
  );
}
