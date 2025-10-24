import EditingToolbar from "@/components/menu/EditingToolbar";
import PageContents from "@/components/pages/PageContents";
import Editor from "@/editor/Editor";
import InsertToolbar from "@/components/toolbars/insert/InsertToolbar";
import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import If from "@/jsx/if";
import { isSignedIn } from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface EditablePageProps {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePageProps) {
  const editor = Editor.init(page);
  const { isEditable, selection, rootTiles } = editor;
  const showToolbar = !import.meta.env.SSR && isSignedIn();

  return (
    <>
      <PageContents editor={editor} tiles={rootTiles} />

      {showToolbar ? <EditingToolbar editor={editor} /> : null}

      <If condition={selection.derive((value) => value.size >= 2)}>
        <SelectionToolbar />
      </If>

      <If condition={isEditable}>
        <InsertToolbar />
      </If>
    </>
  );
}
