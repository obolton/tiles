import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import Grid from "@/components/grid/Grid";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { EditorContext } from "@/context/editor";
import useStore from "@/hooks/useStore";
import type { AppRouterOutputs } from "@/api/client";

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editorRef = useRef<Editor>(null);
  editorRef.current ??= new Editor(page);
  const tiles = useStore(editorRef.current.tiles);

  return (
    <EditorContext value={editorRef.current}>
      <EditingToolbar isPublished={page.published} />

      <PageHeader
        title={page.title}
        subtitle={page.subtitle}
        coverImageUrl={page.coverImageUrl}
        author={page.author}
        updatedAt={page.updatedAt}
      />

      <Grid tiles={tiles} />

      <ModalLauncher />
    </EditorContext>
  );
}
