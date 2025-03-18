import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import PageContents from "@/components/pages/PageContents";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { EditorContext } from "@/context/editor";
import { DragIdContext } from "@/context/drag";
import useStore from "@/hooks/useStore";
import useDragListener from "@/hooks/useDragListener";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor");
}

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editorRef = useRef<Editor>(null);
  editorRef.current ??= new Editor(page);
  const layout = useStore(editorRef.current.layout);
  const dragId = useDragListener();
  const focusedTile = useStore(editorRef.current.focusedTile);

  return (
    <EditorContext value={editorRef.current}>
      <DragIdContext value={dragId}>
        <PageHeader
          title={page.title}
          subtitle={page.subtitle}
          coverImageUrl={page.coverImageUrl}
          author={page.author}
          updatedAt={page.updatedAt}
        />

        <main>
          <PageContents layout={layout} />
        </main>

        {!focusedTile ? <EditingToolbar isPublished={page.published} /> : null}
        <ModalLauncher />
      </DragIdContext>
    </EditorContext>
  );
}
