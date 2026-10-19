import Search from "@/components/search/Search";
import SearchToolbar from "@/components/search/SearchToolbar";
import InviteRow from "@/components/collaboration/InviteRow";
import Placeholder from "@/components/placeholder/Placeholder";
import NewIcon from "@/icons/new.svg?jsx";
import client from "@/api/client";
import { reactive } from "reactivity";
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

const InviteModalLoader = () => import("@/components/modals/invite/InviteModal");

export default function WorkspaceInvites({
  workspaceId,
  workspaceName,
  invites: initialInvites,
}: WorkspaceInvitesProps) {
  const query = reactive("");
  const invites = reactive(initialInvites.invites);
  const nextCursor = reactive(initialInvites.nextCursor);

  const onSearch = async (query: string, cursor: string | null) => {
    try {
      if (!query && !cursor) {
        invites.value = initialInvites.invites;
        nextCursor.value = initialInvites.nextCursor;
        return;
      }

      const results = await client.workspaces.listInvites.query({
        workspaceId,
        query: query || undefined,
        cursor: cursor ?? undefined,
      });
      if (!cursor) {
        invites.value = results.invites;
      } else {
        invites.value = [...invites.value, ...results.invites];
      }
      nextCursor.value = results.nextCursor;
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
      invites.value = invites.value.filter((existingInvite) => existingInvite !== invite);
      showToast(`The invite for ${invite.email} was revoked.`, "success");
    } catch (error) {
      handleError(error);
    }
  };

  function onClickInvite() {
    void showModal(InviteModalLoader, {
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
    <>
      <SearchToolbar
        id="search-invites"
        classList={{ [styles.toolbar]: true }}
        placeholder="Search invites"
        query={query}
      />

      <Search
        itemsClassName={styles.invites}
        search={onSearch}
        results={invites}
        nextCursor={nextCursor}
        query={query}
        render={(invite) => <InviteRow invite={invite} showRemoveButton onRemove={onRemove} />}
        renderPlaceholder={(query) => (
          <Placeholder>{query ? "There are no results" : "No invites"}</Placeholder>
        )}
      />

      <button type="button" className="primary" on:click={onClickInvite}>
        <NewIcon aria-hidden="true" />
        Invite to workspace
      </button>
    </>
  );
}
