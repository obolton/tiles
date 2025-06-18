import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import type { AppRouterOutputs } from "@/api/client";

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
          search={(query, offset) =>
            client.pages.listShared.query({
              query: query || undefined,
              offset,
            })
          }
          renderPlaceholder={renderPlaceholder}
          draggable
        />
      </SidebarLayout>
    </PageLayout>
  );
}
