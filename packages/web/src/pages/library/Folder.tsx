import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import SettingsIcon from "@/icons/settings.svg?jsx";
import { showModal } from "@/utils/modals";
import { redirectWithToast } from "@/utils/toasts";
import type { AppRouterOutputs } from "@/api/client";

const FolderModalLoader = () =>
  import("@/components/modals/folders/FolderModal");

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
  pages,
}: FolderProps) {
  function editFolder() {
    showModal(FolderModalLoader, {
      props: {
        name,
        showDelete: true,
      },
      async onConfirm(result) {
        if (result === "DELETE") {
          await client.folders.delete.mutate({
            workspaceId: workspace.id,
            id,
          });
          redirectWithToast("/library", "The folder was deleted.", "success");
          return;
        }
        await client.folders.update.mutate({
          workspaceId: workspace.id,
          id,
          name: result.name,
        });
      },
    });
  }

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
        <header>
          <h2>{name}</h2>
          <button
            type="button"
            className="floating"
            aria-label="Folder settings"
            data-tooltip="Folder settings"
            on:click={editFolder}
          >
            <SettingsIcon aria-hidden="true" />
          </button>
        </header>

        <PagesGrid
          inputPlaceholder={`Search in ${name}`}
          pages={pages}
          search={(query, cursor) =>
            client.folders.listPages.query({
              workspaceId: workspace.id,
              id,
              query: query || undefined,
              cursor: cursor ?? undefined,
            })
          }
          renderPlaceholder={renderPlaceholder}
          draggable
        />
      </SidebarLayout>
    </PageLayout>
  );
}
