import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import Grid from "@/components/grid/Grid";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { EditorContext } from "@/context/editor";
import { DragIdContext } from "@/context/drag";
import useStore from "@/hooks/useStore";
import useDragListener from "@/hooks/useDragListener";
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
          <Grid tiles={tiles} />
        </main>

        <ModalLauncher />
      </DragIdContext>
    </EditorContext>
  );
}
