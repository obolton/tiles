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
import { persistent } from "@/utils/reactivity";
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

export default function Shared({ workspace, folders, pages }: SharedProps) {
  const sort = persistent<PageSort>("library:sort", "updatedAt:desc");

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="SHARED"
          />
        }
      >
        <header>
          <h2>Shared with you</h2>
        </header>

        <PagesGrid
          inputPlaceholder="Search pages shared with you"
          pages={pages}
          search={(query, cursor) => {
            const { sortBy, sortDirection } = parsePageSort(sort.value);
            return client.pages.listShared.query({
              workspaceId: workspace.id,
              query: query || undefined,
              cursor: cursor ?? undefined,
              sortBy,
              sortDirection,
            });
          }}
          renderPlaceholder={renderPlaceholder}
          sort={sort}
          draggable
        />
      </SidebarLayout>
    </PageLayout>
  );
}
