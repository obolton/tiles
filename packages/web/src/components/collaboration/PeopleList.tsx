import UserRow from "./UserRow";
import InviteRow from "./InviteRow";
import NewIcon from "@/icons/new.svg?jsx";
import If from "@/jsx/if";
import PageInvite from "@/models/PageInvite";
import { user as currentUser } from "@/utils/sessions";
import { combine } from "@/utils/reactivity";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./SharePanel.module.css";
import type Page from "@/models/Page";
import type { User } from "@/types/collaboration";
import type { Reactive } from "@/utils/reactivity";

const InviteModalLoader = () => import("@/components/modals/invite/InviteModal");

export interface PeopleListProps {
  page: Page;
  /** IDs of the users currently connected to the page. */
  online: Reactive<Set<string>>;
}

function deleteInvite(invite: PageInvite) {
  invite
    .delete()
    .then(() => showToast(`The invite for ${invite.email} was cancelled.`, "success"))
    .catch(handleError);
}

export default function PeopleList({ page, online }: PeopleListProps) {
  const { access, invites } = page;
  const ownerLabel = currentUser.derive((value) =>
    value?.id === page.author.id ? "Owner · You" : "Owner",
  );
  const hasInvites = invites.derive((items) => items.length > 0);
  const isEmpty = combine(
    { access, invites },
    ({ access, invites }) => access.length === 0 && invites.length === 0,
  );

  function showInviteModal() {
    void showModal(InviteModalLoader, {
      props: {
        title: "Invite to page",
      },
      async onConfirm({ email }) {
        try {
          await PageInvite.create(page, email);
          showToast(`An invite was sent to ${email}`, "success");
        } catch (error) {
          handleError(error);
        }
      },
    });
  }

  function revokeAccess(user: User) {
    page
      .revokeAccess(user.id)
      .then(() => showToast(`${user.name}’s access was revoked.`, "success"))
      .catch(handleError);
  }

  return (
    <section className={styles.section} aria-labelledby="share-people">
      <div className={styles.row}>
        <h3 id="share-people" className={styles.heading}>
          People
        </h3>
        <button type="button" className="secondary small" on:click={showInviteModal}>
          <NewIcon aria-hidden="true" />
          Invite
        </button>
      </div>

      <ul className={styles.list} aria-label="People with access">
        <UserRow user={page.author} description={ownerLabel} />

        {access.derive((items) =>
          items.map((item) => {
            const isOnline = online.derive((ids) => ids.has(item.user.id));
            return (
              <UserRow
                user={item.user}
                description={isOnline.derive((value) => (value ? "Editor · Online" : "Editor"))}
                online={isOnline}
                showRemoveButton
                onRemove={revokeAccess}
              />
            );
          }),
        )}
      </ul>

      <If condition={hasInvites}>
        <>
          <h4 id="share-pending" className={styles.heading}>
            Pending invites
          </h4>
          <ul className={styles.list} aria-labelledby="share-pending">
            {invites.derive((items) =>
              items.map((invite) => (
                <InviteRow invite={invite} showRemoveButton onRemove={deleteInvite} />
              )),
            )}
          </ul>
        </>
      </If>

      <If condition={isEmpty}>
        <p className={styles.empty}>Only you have access</p>
      </If>
    </section>
  );
}
