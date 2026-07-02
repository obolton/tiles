import ProfileImageStack from "./ProfileImageStack";
import type Presence from "@/collaboration/Presence";
import type Editor from "@/editor/Editor";

export interface CollaboratorListProps {
  presence: Presence;
  editor: Editor;
}

export default function CollaboratorList({
  presence,
  editor,
}: CollaboratorListProps) {
  return (
    <ProfileImageStack
      peers={presence}
      aria-label="Collaborators"
      onSelect={(peer) => editor.revealClient(peer.clientId)}
    />
  );
}
