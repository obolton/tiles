import EditingToolbar from "@/components/menu/EditingToolbar";
import PageContents from "@/components/pages/PageContents";
import Editor from "@/editor/Editor";
import InsertToolbar from "@/components/toolbars/insert/InsertToolbar";
import { isSignedIn } from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  const editor = new Editor(page);
  const { isEditable, sections } = editor;
  const showToolbar = !import.meta.env.SSR && isSignedIn();

  return (
    <>
      <main>
        <PageContents editor={editor} sections={sections} />
      </main>

      {showToolbar ? <EditingToolbar editor={editor} /> : null}

      {isEditable.derive((value) =>
        value ? <InsertToolbar editor={editor} /> : null,
      )}
    </>
  );
}
