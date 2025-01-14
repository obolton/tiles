import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import ProfilePageHeader from "@/components/header/ProfilePageHeader";
import Grid from "@/components/grid/Grid";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { EditorContext } from "@/context/editor";
import { DragIdContext } from "@/context/drag";
import useStore from "@/hooks/useStore";
import useDragListener from "@/hooks/useDragListener";
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
          <Grid tiles={tiles} />
        </main>

        <ModalLauncher />
      </DragIdContext>
    </EditorContext>
  );
}
