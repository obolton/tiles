import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
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

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
  showToolbar?: boolean;
}

export default function EditablePage({
  page,
  showToolbar = true,
}: EditablePage) {
  const editorRef = useRef<Editor>(null);
  editorRef.current ??= new Editor(page);
  const tiles = useStore(editorRef.current.tiles);
  const dragId = useDragListener();
  const isEditable = useEditable();

  return (
    <EditorContext value={editorRef.current}>
      <DragIdContext value={dragId}>
        {showToolbar ? <EditingToolbar isPublished={page.published} /> : null}

        <PageHeader
          title={page.title}
          subtitle={page.subtitle}
          coverImageUrl={page.coverImageUrl}
          author={page.author}
          updatedAt={page.updatedAt}
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
