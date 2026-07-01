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
import type { User } from "@/utils/sessions";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface FolderProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  id: string;
  name: string;
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["folders"]["listPages"];
  user: User;
}

function renderPlaceholder(query: string) {
  return <Placeholder>{query ? "There are no results." : "The folder is empty."}</Placeholder>;
}

export default function Folder({
  workspace,
  id,
  name,
  folders,
  pages: initialPages,
  user,
}: FolderProps) {
  const query = reactive("");
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  return (
    <PageLayout
      workspaceId={workspace.id}
      user={user}
      center={
        <SearchToolbar
          id="search-pages"
          placeholder={`Search in ${name}`}
          query={query}
          sortOptions={<PageSortOptions />}
          sort={sort}
        />
      }
    >
      <SidebarLayout
        sidebar={<Sidebar workspace={workspace} folders={folders} selectedFolderId={id} />}
      >
        <PagesGrid
          workspaceId={workspace.id}
          query={query}
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.folders.listPages.query({
              workspaceId: workspace.id,
              id,
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
