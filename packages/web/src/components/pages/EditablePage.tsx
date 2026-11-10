import PageContents from "@/components/pages/PageContents";
import BottomBar from "@/components/pages/BottomBar";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import SharePanel from "@/components/collaboration/SharePanel";
import ThemeEditorPanel from "@/components/themes/ThemeEditorPanel";
import If from "jsx/if";
import { combine } from "carillon";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface EditablePageProps {
  editor: Editor;
}

export default function EditablePage({ editor }: EditablePageProps) {
  const { isEditable, selection, versionHistory, share, themeEditor } = editor;

  const showPageToolbar = combine(
    { selection, isEditable },
    ({ selection, isEditable }) => isEditable && selection.size === 0,
  );

  const sidebar = editor.sidebar.derive((panel) => {
    switch (panel) {
      case versionHistory:
        return <VersionHistoryPanel state={versionHistory} />;
      case share:
        return <SharePanel state={share} editor={editor} />;
      case themeEditor:
        return <ThemeEditorPanel state={themeEditor} />;
      default:
        return null;
    }
  });

  const bar = (
    <If condition={isEditable}>
      <BottomBar editor={editor} />
    </If>
  );

  return (
    <PageContents
      page={editor.page}
      isEditable={isEditable}
      showToolbar={showPageToolbar}
      tiles={editor.page.tiles}
      bar={bar}
      end={sidebar}
    />
  );
}
