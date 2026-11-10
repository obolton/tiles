import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import If from "jsx/if";
import client from "@/api/client";
import { reactive } from "carillon";
import { showToast, redirectWithToast } from "@/utils/toasts";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import styles from "./General.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

const DeleteWorkspaceModalLoader = () =>
  import("@/components/modals/workspaces/DeleteWorkspaceModal");

export interface GeneralProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  user: User;
}

export default function General({ workspace, user }: GeneralProps) {
  const isAdmin = reactive(workspace.role === "ADMIN");

  function deleteWorkspace() {
    void showModal(DeleteWorkspaceModalLoader, {
      props: { name: workspace.name },
      async onConfirm() {
        await client.workspaces.delete.mutate({ workspaceId: workspace.id });
        redirectWithToast("/", "Workspace deleted.", "success");
      },
    });
  }

  async function onSubmit(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    form.dataset.pending = "true";
    delete form.dataset.error;

    try {
      const formData = new FormData(form);
      await client.workspaces.update.mutate({
        workspaceId: workspace.id,
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

  return (
    <PageLayout workspaceId={workspace.id} user={user} center={<h1>Settings</h1>}>
      <SidebarLayout
        sidebar={
          <Sidebar workspaceId={workspace.id} page="GENERAL" isAdmin={workspace.role === "ADMIN"} />
        }
      >
        <form class="vertical" on:submit={onSubmit}>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={workspace.name}
              placeholder="Name"
              required
              maxlength={64}
              disabled={isAdmin.derive((admin) => !admin)}
            />
          </label>

          <If condition={isAdmin}>
            <footer>
              <button className="primary" type="submit">
                Save
              </button>
            </footer>
          </If>
        </form>

        <If condition={isAdmin}>
          <section className={styles.delete}>
            <h3>Danger zone</h3>
            <button type="button" className="secondary destructive" on:click={deleteWorkspace}>
              Delete workspace
            </button>
          </section>
        </If>
      </SidebarLayout>
    </PageLayout>
  );
}
