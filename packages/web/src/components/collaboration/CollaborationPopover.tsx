import UserRow from "./UserRow";
import InviteRow from "./InviteRow";
import NewIcon from "@/icons/new.svg?jsx";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./CollaborationPopover.module.css";
import type Editor from "@/editor/Editor";
import type { Invite, User } from "@/types/collaboration";
import type { JSX } from "@/jsx/jsx";
import type PopoverMenu from "@/elements/menu/PopoverMenu";

const InviteModalLoader = () =>
  import("@/components/modals/invite/InviteModal");

export interface CollaborationPopoverProps extends JSX.Attributes<PopoverMenu> {
  editor: Editor;
}

export default function CollaborationPopover({
  editor,
  ...props
}: CollaborationPopoverProps) {
  const { access, invites, isPublished } = editor;

  function setPublished(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const publish = input.checked;
    editor
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
          await editor.sendInvite(email);
          showToast(`An invite was sent to ${email}`, "success");
        } catch (error) {
          handleError(error);
        }
      },
    });
  }

  function revokeAccess(user: User) {
    editor
      .revokeAccess(user.id)
      .then(() => showToast(`${user.name}’s access was revoked.`, "success"))
      .catch(handleError);
  }

  function deleteInvite(invite: Invite) {
    editor
      .deleteInvite(invite.id)
      .then(() =>
        showToast(`The invite for ${invite.email} was cancelled.`, "success"),
      )
      .catch(handleError);
  }

  return (
    <popover-menu {...props} className={styles.popover}>
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
            user={editor.author}
            description="Owner"
            showRemove={false}
            onRemove={revokeAccess}
          />
        </li>

        {access.derive((items) =>
          items.map((access) => (
            <li>
              <UserRow
                user={access.user}
                description="Editor"
                showRemove
                onRemove={revokeAccess}
              />
            </li>
          )),
        )}

        {invites.derive((items) =>
          items.map((invite) => (
            <li>
              <InviteRow invite={invite} showRemove onRemove={deleteInvite} />
            </li>
          )),
        )}
      </ul>
    </popover-menu>
  );
}
