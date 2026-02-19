import UserRow from "./UserRow";
import InviteRow from "./InviteRow";
import NewIcon from "@/icons/new.svg?jsx";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./CollaborationPopover.module.css";
import PageInvite from "@/models/PageInvite";
import type Page from "@/models/Page";
import type { User } from "@/types/collaboration";
import type { JSX } from "@/jsx/jsx";

const InviteModalLoader = () =>
  import("@/components/modals/invite/InviteModal");

export interface CollaborationPopoverProps extends JSX.Attributes<"anchored-popover"> {
  page: Page;
}

export default function CollaborationPopover({
  page,
  ...props
}: CollaborationPopoverProps) {
  const { access, invites, isPublished } = page;

  function setPublished(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const publish = input.checked;
    page
      .setPublished(publish)
      .then(() =>
        publish
          ? showToast("The page was published.", "success")
          : showToast("The page was unpublished.", "success"),
      )
      .catch(handleError);
  }

  function showInviteModal() {
    showModal(InviteModalLoader, {
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

  function deleteInvite(invite: PageInvite) {
    invite
      .delete()
      .then(() =>
        showToast(`The invite for ${invite.email} was cancelled.`, "success"),
      )
      .catch(handleError);
  }

  return (
    <anchored-popover {...props} className={styles.popover}>
      <label>
        Public link
        <input
          id="public"
          type="checkbox"
          role="switch"
          on:change={setPublished}
          checked={isPublished}
        />
      </label>

      <button type="button" className="secondary" on:click={showInviteModal}>
        <NewIcon aria-hidden="true" />
        Invite
      </button>

      <ul>
        <li>
          <UserRow
            user={page.author}
            description="Owner"
            showRemoveButton={false}
            onRemove={revokeAccess}
          />
        </li>

        {access.derive((items) =>
          items.map((access) => (
            <li>
              <UserRow
                user={access.user}
                description="Editor"
                showRemoveButton
                onRemove={revokeAccess}
              />
            </li>
          )),
        )}

        {invites.derive((items) =>
          items.map((invite) => (
            <li>
              <InviteRow
                invite={invite}
                showRemoveButton
                onRemove={deleteInvite}
              />
            </li>
          )),
        )}
      </ul>
    </anchored-popover>
  );
}
