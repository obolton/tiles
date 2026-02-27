import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import WorkspaceMembers from "@/components/workspaces/WorkspaceMembers";
import { reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface MembersProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  users: AppRouterOutputs["workspaces"]["listUsers"];
}

export default function Members({ workspace, users }: MembersProps) {
  const isAdmin = reactive(workspace.role === "ADMIN");

  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={
          <Sidebar
            workspaceId={workspace.id}
            page="MEMBERS"
            isAdmin={workspace.role === "ADMIN"}
          />
        }
      >
        <header>
          <h2>Members</h2>
        </header>

        <WorkspaceMembers
          workspaceId={workspace.id}
          members={users}
          isAdmin={isAdmin}
        />
      </SidebarLayout>
    </PageLayout>
  );
}
