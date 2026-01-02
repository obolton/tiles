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
  nextCursor: string | null;
}

export interface DeletedPagesGridProps {
  workspaceId: string;
  inputPlaceholder?: string;
  search: (query: string, cursor: string | null) => Promise<PagesSearchResults>;
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
  const nextCursor = reactive(initialPages?.nextCursor ?? null);

  const onSearch = async (query: string, cursor: string | null) => {
    try {
      if (!query && !cursor) {
        pages.value = initialPages?.pages ?? [];
        nextCursor.value = initialPages?.nextCursor ?? null;
        return;
      }

      const results = await search(query, cursor);
      if (!cursor) {
        pages.value = results.pages;
      } else {
        pages.value = [...pages.value, ...results.pages];
      }
      nextCursor.value = results.nextCursor;
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
        <button type="button" className="secondary" on:click={emptyTrash}>
          Empty trash
        </button>
      </aside>

      <Search
        id="search-pages"
        itemsClassName={styles.pages}
        search={onSearch}
        results={pages}
        nextCursor={nextCursor}
        placeholder={inputPlaceholder}
        render={(page) => (
          <DeletedPage
            workspaceId={workspaceId}
            pageId={page.id}
            title={page.title}
            background={page.background}
          />
        )}
        renderPlaceholder={renderPlaceholder}
      />
    </>
  );
}
