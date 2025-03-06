import { lazy, useCallback, useState } from "react";
import { registerModal, showModal } from "@/utils/modals";
import PageAccessRow from "./PageAccessRow";
import PageInviteRow from "./PageInviteRow";
import privateIcon from "@/icons/private.svg";
import publicIcon from "@/icons/public.svg";
import peopleIcon from "@/icons/people.svg";
import newIcon from "@/icons/new.svg";
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
    <>
      {isPublished ? (
        <button
          id="unpublish"
          className="floating"
          role="menuitem"
          aria-label="Published"
          data-tooltip="This page is published"
          disabled={allowPublish ? undefined : true}
          onClick={unpublishPage}
        >
          <img className="icon" src={publicIcon.src} alt="Published" />
        </button>
      ) : (
        <button
          id="publish"
          className="floating"
          role="menuitem"
          aria-label="Private"
          data-tooltip="This page is private"
          disabled={allowPublish ? undefined : true}
          onClick={publishPage}
        >
          <img className="icon" src={privateIcon.src} alt="Private" />
        </button>
      )}

      <button
        id="access-button"
        className="floating"
        role="menuitem"
        aria-label="Page access"
        data-tooltip="Page access"
        popoverTarget="access-popover"
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <img className="icon" src={peopleIcon.src} alt="Page access" />
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
              <img
                className="icon"
                src={newIcon.src}
                alt="Invite to page"
                aria-hidden="true"
              />
              Invite to page
            </button>
          </li>
        </menu>
      </popover-menu>
    </>
  );
}
