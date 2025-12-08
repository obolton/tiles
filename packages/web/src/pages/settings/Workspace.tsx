import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import WorkspaceMembers from "@/components/workspaces/WorkspaceMembers";
import WorkspaceInvites from "@/components/workspaces/WorkspaceInvites";
import client from "@/api/client";
import { showToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import styles from "./Workspace.module.css";
import type { AppRouterOutputs } from "@/api/client";

export interface WorkspaceProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  users: AppRouterOutputs["workspaces"]["listUsers"];
  invites: AppRouterOutputs["workspaces"]["listInvites"];
}

async function onSubmit(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  event.preventDefault();

  form.dataset.pending = "true";
  delete form.dataset.error;

  try {
    const formData = new FormData(form);
    await client.workspaces.update.mutate({
      workspaceId: formData.get("id") as string,
      name: (formData.get("name") as string | null) ?? "",
    });
    showToast("Your workspace settings were saved.", "success");
  } catch (error) {
    form.dataset.error = "true";
    handleError(error);
  } finally {
    delete form.dataset.pending;
  }
}

export default function Workspace({
  workspace,
  users,
  invites,
}: WorkspaceProps) {
  return (
    <PageLayout workspaceId={workspace.id}>
      <SidebarLayout
        sidebar={<Sidebar workspaceId={workspace.id} page="WORKSPACE" />}
      >
        <header>
          <h2>Workspace</h2>
        </header>

        <div className={styles.sections}>
          <form class="vertical" on:submit={onSubmit}>
            <input type="hidden" name="id" value={workspace.id} />

            <label>
              Name
              <input
                type="text"
                name="name"
                value={workspace.name}
                placeholder="Name"
                required
                maxlength={64}
              />
            </label>

            <footer>
              <button className="primary" type="submit">
                Save
              </button>
            </footer>
          </form>

          <WorkspaceMembers workspaceId={workspace.id} members={users} />

          <WorkspaceInvites
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            invites={invites}
          />
        </div>
      </SidebarLayout>
    </PageLayout>
  );
}
