import { lazy, useCallback, useState } from "react";
import { registerModal, showModal } from "@/utils/modals";
import PageAccessRow from "./PageAccessRow";
import PageInviteRow from "./PageInviteRow";
import PrivateIcon from "@/icons/private.svg?jsx";
import PublicIcon from "@/icons/public.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import { useEditor } from "@/context/editor";
import { showToast } from "@/utils/toasts";
import type { InviteModalResult } from "@/components/modals/invite/InviteModal";
import useStore from "@/hooks/useStore";
import type { PageInvite, User } from "@/types/collaboration";

registerModal(
  "INVITE",
  lazy(() => import("@/components/modals/invite/InviteModal")),
);

interface CollaborationButtonsProps {
  isPublished: boolean;
  allowPublish: boolean;
}

export default function CollaborationButtons({
  isPublished: initialIsPublished,
  allowPublish,
}: CollaborationButtonsProps) {
  const editor = useEditor();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const access = useStore(editor.access);
  const invites = useStore(editor.invites);

  const publishPage = useCallback(async () => {
    try {
      await editor.setPublished(true);
      setIsPublished(true);
      showToast("The page was published.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  const unpublishPage = useCallback(async () => {
    try {
      await editor.setPublished(false);
      setIsPublished(false);
      showToast("The page was unpublished.", "success");
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

  const showInviteModal = useCallback(
    () =>
      showModal<InviteModalResult>("INVITE", {
        async onConfirm({ email }) {
          try {
            await editor.sendInvite(email);
            showToast(`An invite was sent to ${email}`, "success");
          } catch (error) {
            handleError(error);
          }
        },
      }),
    [editor],
  );

  const revokeAccess = useCallback(
    async (user: User) => {
      try {
        await editor.revokeAccess(user.id);
        showToast(`${user.name}’s access was revoked.`, "success");
      } catch (error) {
        handleError(error);
      }
    },
    [editor],
  );

  const deleteInvite = useCallback(
    async (invite: PageInvite) => {
      try {
        await editor.deleteInvite(invite.id);
        showToast(`The invite for ${invite.email} was cancelled.`, "success");
      } catch (error) {
        handleError(error);
      }
    },
    [editor],
  );

  return (
    <ul role="group">
      <li role="presentation">
        {isPublished ? (
          <button
            role="menuitem"
            id="unpublish"
            className="floating small"
            aria-label="Published"
            data-tooltip="This page is published"
            disabled={allowPublish ? undefined : true}
            onClick={unpublishPage}
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
            onClick={publishPage}
          >
            <PrivateIcon aria-hidden="true" />
          </button>
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

            {access.map((access) => (
              <PageAccessRow
                key={access.user.id}
                user={access.user}
                description="Editor"
                showRemove
                onRemove={revokeAccess}
              />
            ))}

            {invites.map((invite) => (
              <PageInviteRow
                key={invite.id}
                invite={invite}
                onRemove={deleteInvite}
              />
            ))}

            <li>
              <button type="button" onClick={showInviteModal}>
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
