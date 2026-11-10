import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import WorkspaceMembers from "@/components/workspaces/WorkspaceMembers";
import { reactive } from "carillon";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface MembersProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  users: AppRouterOutputs["workspaces"]["listUsers"];
  user: User;
}

export default function Members({ workspace, users, user }: MembersProps) {
  const isAdmin = reactive(workspace.role === "ADMIN");

  return (
    <PageLayout workspaceId={workspace.id} user={user} center={<h1>Settings</h1>}>
      <SidebarLayout
        sidebar={
          <Sidebar workspaceId={workspace.id} page="MEMBERS" isAdmin={workspace.role === "ADMIN"} />
        }
      >
        <WorkspaceMembers workspaceId={workspace.id} members={users} isAdmin={isAdmin} />
      </SidebarLayout>
    </PageLayout>
  );
}
