import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import DeletedPagesGrid from "@/components/grid/DeletedPagesGrid";
import { parsePageSort, type PageSort } from "@/components/grid/PagesGrid";
import { handleError } from "@/utils/errors";
import { persistent } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface TrashProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["pages"]["listDeleted"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "There are no pages in the trash."}
    </Placeholder>
  );
}

export default function Trash({ workspace, folders, pages }: TrashProps) {
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="TRASH"
          />
        }
      >
        <header>
          <h2>Trash</h2>
        </header>

        <DeletedPagesGrid
          workspaceId={workspace.id}
          inputPlaceholder="Search trash"
          pages={pages}
          search={(query, cursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.pages.listDeleted.query({
              workspaceId: workspace.id,
              query: query || undefined,
              cursor: cursor ?? undefined,
              sortBy,
              sortDirection,
            });
          }}
          renderPlaceholder={renderPlaceholder}
          sort={sort}
        />
      </SidebarLayout>
    </PageLayout>
  );
}
