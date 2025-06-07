import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import DeletedPagesGrid from "@/components/grid/DeletedPagesGrid";
import type { AppRouterOutputs } from "@/api/client";

export interface TrashProps {
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

export default function Trash({ folders, pages }: TrashProps) {
  return (
    <PageLayout>
      <SidebarLayout
        sidebar={<Sidebar folders={folders} selectedFolderId="TRASH" />}
      >
        <header>
          <h2>Trash</h2>
        </header>

        <DeletedPagesGrid
          inputPlaceholder="Search trash"
          pages={pages}
          search={(query, offset) =>
            client.pages.listDeleted.query({
              query: query || undefined,
              offset,
            })
          }
          renderPlaceholder={renderPlaceholder}
        />
      </SidebarLayout>
    </PageLayout>
  );
}
