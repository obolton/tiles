import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid, {
  parsePageSort,
  type PageSort,
} from "@/components/grid/PagesGrid";
import { handleError } from "@/utils/errors";
import { reactive, persistent } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface FolderProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  id: string;
  name: string;
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["folders"]["listPages"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "The folder is empty."}
    </Placeholder>
  );
}

export default function Folder({
  workspace,
  id,
  name,
  folders,
  pages: initialPages,
}: FolderProps) {
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId={id}
          />
        }
      >
        <PagesGrid
          workspaceId={workspace.id}
          inputPlaceholder={`Search in ${name}`}
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
