import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import WorkspaceInvites from "@/components/workspaces/WorkspaceInvites";
import type { AppRouterOutputs } from "@/api/client";

export interface InvitesProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  invites: AppRouterOutputs["workspaces"]["listInvites"];
}

export default function Invites({ workspace, invites }: InvitesProps) {
  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspaceId={workspace.id}
            page="INVITES"
            isAdmin={workspace.role === "ADMIN"}
          />
        }
      >
        <header>
          <h2>Invites</h2>
        </header>

        <WorkspaceInvites
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          invites={invites}
        />
      </SidebarLayout>
    </PageLayout>
  );
}
