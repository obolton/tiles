import { registerModal, showModal } from "@/utils/modals";
import PageAccessRow from "./PageAccessRow";
import PageInviteRow from "./PageInviteRow";
import PrivateIcon from "@/icons/private.svg?jsx";
import PublicIcon from "@/icons/public.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import type { InviteModalResult } from "@/components/modals/invite/InviteModal";
import type { PageInvite, User } from "@/types/collaboration";
import type Editor from "@/editor/Editor";
import type { StoreInterface } from "@/utils/stores";

registerModal("INVITE", () => import("@/components/modals/invite/InviteModal"));

interface CollaborationButtonsProps {
  editor: Editor;
  isPublished: StoreInterface<boolean>;
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

  const deleteInvite = async (invite: PageInvite) => {
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
              className="floating small"
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
              className="floating small"
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
          className="floating small"
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
            <PageAccessRow
              user={editor.author}
              description="Owner"
              showRemove={false}
              onRemove={revokeAccess}
            />

            {access.derive((items) =>
              items.map((access) => (
                <PageAccessRow
                  user={access.user}
                  description="Editor"
                  showRemove
                  onRemove={revokeAccess}
                />
              )),
            )}

            {invites.derive((items) =>
              items.map((invite) => (
                <PageInviteRow invite={invite} onRemove={deleteInvite} />
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
