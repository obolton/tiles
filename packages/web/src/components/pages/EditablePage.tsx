import EditingToolbar from "@/components/menu/EditingToolbar";
import PageContents from "@/components/pages/PageContents";
import Editor from "@/editor/Editor";
import InsertToolbar from "@/components/toolbars/insert/InsertToolbar";
import { isSignedIn } from "@/utils/sessions";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor");
}

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editor = new Editor(page);
  const { isEditable, layout, isPublished, focusedTile } = editor;
  const showToolbar = !import.meta.env.SSR && isSignedIn();

  return (
    <>
      <main>
        <PageContents editor={editor} isEditable={isEditable} layout={layout} />
      </main>

      {showToolbar
        ? focusedTile.derive((id) =>
            id ? null : (
              <EditingToolbar
                editor={editor}
                isEditable={isEditable}
                isPublished={isPublished}
              />
            ),
          )
        : null}

      {isEditable.derive((value) =>
        value ? <InsertToolbar editor={editor} /> : null,
      )}
    </>
  );
}
