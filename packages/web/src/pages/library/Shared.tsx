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
import { reactive, persistent } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface SharedProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listShared"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query
        ? "There are no results."
        : "You haven't been shared any pages yet."}
    </Placeholder>
  );
}

export default function Shared({
  workspace,
  folders,
  pages: initialPages,
}: SharedProps) {
  const query = reactive("");
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  return (
    <PageLayout
      workspaceId={workspace.id}
      center={
        <SearchToolbar
          id="search-pages"
          placeholder="Search pages shared with you"
          query={query}
          sortOptions={<PageSortOptions />}
          sort={sort}
        />
      }
    >
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="SHARED"
          />
        }
      >
        <PagesGrid
          workspaceId={workspace.id}
          query={query}
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.pages.listShared.query({
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
        />
      </SidebarLayout>
    </PageLayout>
  );
}
