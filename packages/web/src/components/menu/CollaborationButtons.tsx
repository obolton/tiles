import { registerModal, showModal } from "@/utils/modals";
import UserRow from "./UserRow";
import InviteRow from "./InviteRow";
import PrivateIcon from "@/icons/private.svg?jsx";
import PublicIcon from "@/icons/public.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import type { InviteModalResult } from "@/components/modals/invite/InviteModal";
import type { Invite, User } from "@/types/collaboration";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";

registerModal("INVITE", () => import("@/components/modals/invite/InviteModal"));

interface CollaborationButtonsProps {
  editor: Editor;
  isPublished: Reactive<boolean>;
  allowPublish: boolean;
}

export default function CollaborationButtons({
  editor,
  isPublished,
  allowPublish,
}: CollaborationButtonsProps) {
  const { access, invites } = editor;

  const publishPage = async () => {
    try {
      await editor.setPublished(true);
      showToast("The page was published.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const unpublishPage = async () => {
    try {
      await editor.setPublished(false);
      showToast("The page was unpublished.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const showInviteModal = () =>
    showModal<InviteModalResult>("INVITE", {
      title: "Invite to page",
      async onConfirm({ email }) {
        try {
          await editor.sendInvite(email);
          showToast(`An invite was sent to ${email}`, "success");
        } catch (error) {
          handleError(error);
        }
      },
    });

  const revokeAccess = async (user: User) => {
    try {
      await editor.revokeAccess(user.id);
      showToast(`${user.name}’s access was revoked.`, "success");
    } catch (error) {
      handleError(error);
    }
  };

  const deleteInvite = async (invite: Invite) => {
    try {
      await editor.deleteInvite(invite.id);
      showToast(`The invite for ${invite.email} was cancelled.`, "success");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <ul role="group" aria-label="Collaboration tools">
      <li role="presentation">
        {isPublished.derive((published) =>
          published ? (
            <button
              role="menuitem"
              id="unpublish"
              className="floating"
              aria-label="Published"
              data-tooltip="This page is published"
              disabled={allowPublish ? undefined : true}
              onclick={unpublishPage}
            >
              <PublicIcon aria-hidden="true" />
            </button>
          ) : (
            <button
              role="menuitem"
              id="publish"
              className="floating"
              aria-label="Private"
              data-tooltip="This page is private"
              disabled={allowPublish ? undefined : true}
              onclick={publishPage}
            >
              <PrivateIcon aria-hidden="true" />
            </button>
          ),
        )}
      </li>

      <li role="presentation">
        <button
          role="menuitem"
          id="access-button"
          className="floating"
          aria-label="Page access"
          data-tooltip="Page access"
          popoverTarget="access-popover"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <PeopleIcon aria-hidden="true" />
        </button>

        <popover-menu id="access-popover" anchor="access-button">
          <menu>
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
                  <InviteRow
                    invite={invite}
                    showRemove
                    onRemove={deleteInvite}
                  />
                </li>
              )),
            )}

            <li>
              <button type="button" onclick={showInviteModal}>
                <NewIcon aria-hidden="true" />
                Invite to page
              </button>
            </li>
          </menu>
        </popover-menu>
      </li>
    </ul>
  );
}
