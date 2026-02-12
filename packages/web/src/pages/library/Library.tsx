import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid, {
  parsePageSort,
  type PageSort,
} from "@/components/grid/PagesGrid";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { reactive, persistent } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface LibraryProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["list"];
}

export default function Library({
  workspace,
  folders,
  pages: initialPages,
}: LibraryProps) {
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  async function createNewPage() {
    try {
      const { id } = await client.pages.create.mutate({
        workspaceId: workspace.id,
        title: "New page",
      });
      window.open(`/pages/${id}?edit=true`);
    } catch (error) {
      handleError(error);
    }
  }

  function renderPlaceholder(query: string) {
    return (
      <Placeholder
        actions={
          query ? undefined : (
            <button
              className="floating"
              type="button"
              aria-label="New page"
              data-tooltip="Create a new page"
              on:click={createNewPage}
            >
              <NewIcon aria-hidden="true" />
            </button>
          )
        }
      >
        {query
          ? "There are no results."
          : "Get started by creating your first page."}
      </Placeholder>
    );
  }

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="RECENT"
          />
        }
      >
        <header>
          <h2>Your pages</h2>
        </header>

        <PagesGrid
          workspaceId={workspace.id}
          inputPlaceholder="Search pages"
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.pages.list.query({
              workspaceId: workspace.id,
              query: query || undefined,
              cursor: searchCursor ?? undefined,
              sortBy,
              sortDirection,
            });
          }}
          renderPlaceholder={renderPlaceholder}
          sort={sort}
          draggable
          move
          trash
        />
      </SidebarLayout>
    </PageLayout>
  );
}
