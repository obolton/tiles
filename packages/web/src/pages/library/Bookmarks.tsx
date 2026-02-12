import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import { reactive } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

export interface BookmarksProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["bookmarks"]["list"];
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "You don’t have any bookmarks."}
    </Placeholder>
  );
}

export default function Bookmarks({
  workspace,
  folders,
  pages: initialPages,
}: BookmarksProps) {
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="BOOKMARKS"
          />
        }
      >
        <header>
          <h2>Bookmarks</h2>
        </header>

        <PagesGrid
          workspaceId={workspace.id}
          inputPlaceholder="Search bookmarks"
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) =>
            client.bookmarks.list.query({
              query: query || undefined,
              cursor: searchCursor ?? undefined,
            })
          }
          renderPlaceholder={renderPlaceholder}
          draggable
        />
      </SidebarLayout>
    </PageLayout>
  );
}
