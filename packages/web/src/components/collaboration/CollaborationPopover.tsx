import UserRow from "./UserRow";
import InviteRow from "./InviteRow";
import NewIcon from "@/icons/new.svg?jsx";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./CollaborationPopover.module.css";
import PageInvite from "@/models/PageInvite";
import type Editor from "@/editor/Editor";
import type { User } from "@/types/collaboration";
import type { JSX } from "@/jsx/jsx";

const InviteModalLoader = () =>
  import("@/components/modals/invite/InviteModal");

export interface CollaborationPopoverProps extends JSX.Attributes<"popover-menu"> {
  editor: Editor;
}

export default function CollaborationPopover({
  editor,
  ...props
}: CollaborationPopoverProps) {
  const { access, invites } = editor;
  const { isPublished } = editor.page;

  function setPublished(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const publish = input.checked;
    editor.page
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
          await PageInvite.create(editor, email);
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

  function deleteInvite(invite: PageInvite) {
    invite
      .delete()
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
            user={editor.page.author}
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
    </popover-menu>
  );
}
