import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import PageContents from "@/components/pages/PageContents";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor");
}

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editor = new Editor(page);
  const {
    isEditable,
    title,
    subtitle,
    coverImageUrl,
    layout,
    isPublished,
    focusedTile,
  } = editor;

  return (
    <>
      <PageHeader
        editor={editor}
        isEditable={isEditable}
        title={title}
        subtitle={subtitle}
        coverImageUrl={coverImageUrl}
        author={page.author}
        updatedAt={page.updatedAt}
      />

      <main>
        <PageContents editor={editor} isEditable={isEditable} layout={layout} />
      </main>

      {focusedTile.derive((id) =>
        id ? null : (
          <EditingToolbar
            editor={editor}
            isEditable={isEditable}
            isPublished={isPublished}
          />
        ),
      )}

      <ModalLauncher />
    </>
  );
}
