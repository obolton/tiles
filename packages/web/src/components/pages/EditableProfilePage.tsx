import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import ProfilePageHeader from "@/components/header/ProfilePageHeader";
import Grid from "@/components/layouts/grid/Grid";
import Placeholder from "@/components/placeholder/Placeholder";
import TileButtons from "@/components/menu/TileButtons";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { EditorContext } from "@/context/editor";
import { DragIdContext } from "@/context/drag";
import useStore from "@/hooks/useStore";
import useDragListener from "@/hooks/useDragListener";
import useEditable from "@/hooks/useEditable";
import type { AppRouterOutputs } from "@/api/client";

interface EditableProfilePageProps {
  user: NonNullable<AppRouterOutputs["pages"]["getProfilePage"]>;
}

export default function EditableProfilePage({
  user,
}: EditableProfilePageProps) {
  const editorRef = useRef<Editor>(null);
  editorRef.current ??= new Editor(user.profilePage);
  const tiles = useStore(editorRef.current.tiles);
  const dragId = useDragListener();
  const isEditable = useEditable();

  return (
    <EditorContext value={editorRef.current}>
      <DragIdContext value={dragId}>
        <EditingToolbar isPublished allowDelete={false} allowPublish={false} />

        <ProfilePageHeader
          name={user.name}
          imageUrl={user.imageUrl}
          subtitle={user.profilePage.subtitle}
        />

        <main>
          {tiles.length > 0 ? (
            <Grid tiles={tiles} />
          ) : (
            <Placeholder actions={isEditable ? <TileButtons /> : undefined}>
              {isEditable
                ? "There’s nothing here yet. Get starting by adding some content."
                : "This page is empty."}
            </Placeholder>
          )}
        </main>

        <ModalLauncher />
      </DragIdContext>
    </EditorContext>
  );
}
