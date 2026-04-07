import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid, {
  PageSortOptions,
  parsePageSort,
  type PageSort,
} from "@/components/grid/PagesGrid";
import SearchToolbar from "@/components/search/SearchToolbar";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import { reactive, persistent } from "@/utils/reactivity";
import If from "@/jsx/if";
import styles from "./Trash.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface TrashProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listDeleted"];
  user: User;
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "There are no pages in the trash."}
    </Placeholder>
  );
}

export default function Trash({
  workspace,
  folders,
  pages: initialPages,
  user,
}: TrashProps) {
  const query = reactive("");
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  async function emptyTrash() {
    try {
      await client.pages.emptyTrash.mutate({ workspaceId: workspace.id });
      pages.value = [];
      cursor.value = null;
      showToast("The trash was emptied.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <PageLayout
      workspaceId={workspace.id}
      user={user}
      center={
        <SearchToolbar
          id="search-pages"
          placeholder="Search trash"
          query={query}
          sortOptions={<PageSortOptions />}
          sort={sort}
        />
      }
      actions={
        <button type="button" className="secondary" on:click={emptyTrash}>
          Empty trash
        </button>
      }
    >
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="TRASH"
          />
        }
      >
        <If condition={pages.derive((p) => p.length > 0)}>
          <aside className={styles.aside}>
            <p>Pages in the trash will be permanently deleted after 30 days.</p>
          </aside>
        </If>

        <PagesGrid
          workspaceId={workspace.id}
          query={query}
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.pages.listDeleted.query({
              workspaceId: workspace.id,
              query: query || undefined,
              cursor: searchCursor ?? undefined,
              sortBy,
              sortDirection,
            });
          }}
          renderPlaceholder={renderPlaceholder}
          sort={sort}
          link={false}
          restore
        />
      </SidebarLayout>
    </PageLayout>
  );
}
