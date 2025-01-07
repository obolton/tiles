import { useRef } from "react";
import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import Grid from "@/components/grid/Grid";
import Editor from "@/editor/editor";
import { EditorContext } from "@/context/editor";
import type { AppRouterOutputs } from "@/api/client";

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editorRef = useRef<Editor>(null);
  editorRef.current ??= new Editor(page.id);

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

      <Grid tiles={page.tiles} />
    </EditorContext>
  );
}
