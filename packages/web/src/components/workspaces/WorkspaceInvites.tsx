import Search from "@/components/search/Search";
import InviteRow from "@/components/collaboration/InviteRow";
import Placeholder from "@/components/placeholder/Placeholder";
import NewIcon from "@/icons/new.svg?jsx";
import client from "@/api/client";
import { reactive, flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import { showModal } from "@/utils/modals";
import styles from "./WorkspaceInvites.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { Invite } from "@/types/collaboration";

export interface WorkspaceInvitesProps {
  workspaceId: string;
  workspaceName: string;
  invites: AppRouterOutputs["workspaces"]["listInvites"];
}

const InviteModalLoader = () =>
  import("@/components/modals/invite/InviteModal");

export default function WorkspaceInvites({
  workspaceId,
  workspaceName,
  invites: initialInvites,
}: WorkspaceInvitesProps) {
  const invites = reactive(initialInvites.invites);
  const hasMore = flag(initialInvites.hasMore);

  const onSearch = async (query: string, offset: number = 0) => {
    try {
      if (!query && offset === 0) {
        invites.value = initialInvites.invites;
        hasMore.value = initialInvites.hasMore;
        return;
      }

      const results = await client.workspaces.listInvites.query({
        workspaceId,
        query: query || undefined,
        offset,
      });
      if (offset === 0) {
        invites.value = results.invites;
      } else {
        invites.value = [...invites.value, ...results.invites];
      }
      hasMore.value = results.hasMore;
    } catch (error) {
      handleError(error);
    }
  };

  const onRemove = async (invite: Invite) => {
    try {
      await client.workspaces.deleteInvite.mutate({
        workspaceId,
        id: invite.id,
      });
      invites.value = invites.value.filter(
        (existingInvite) => existingInvite !== invite,
      );
      showToast(`The invite for ${invite.email} was revoked.`, "success");
    } catch (error) {
      handleError(error);
    }
  };

  function onClickInvite() {
    showModal(InviteModalLoader, {
      props: {
        title: `Invite to ${workspaceName}`,
      },
      async onConfirm({ email }) {
        try {
          const invite = await client.workspaces.invite.mutate({
            workspaceId,
            email,
          });
          invites.value = invites.value.concat(invite);
          showToast(`An invite was sent to ${email}`, "success");
        } catch (error) {
          handleError(error);
        }
      },
    });
  }

  return (
    <section>
      <h3>Invites</h3>

      <Search
        itemsClassName={styles.invites}
        id="search-invites"
        search={onSearch}
        results={invites}
        hasMore={hasMore}
        placeholder="Search invites"
        render={(invite) => (
          <InviteRow invite={invite} showRemoveButton onRemove={onRemove} />
        )}
        renderPlaceholder={(query) => (
          <Placeholder>
            {query ? "There are no results" : "No invites"}
          </Placeholder>
        )}
      />

      <button type="button" className="primary" on:click={onClickInvite}>
        <NewIcon aria-hidden="true" />
        Invite to workspace
      </button>
    </section>
  );
}
