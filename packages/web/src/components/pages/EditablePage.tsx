import PageContents from "@/components/pages/PageContents";
import AIButton from "@/components/buttons/AIButton";
import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import ChatPanel from "@/components/chat/ChatPanel";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import SharePanel from "@/components/collaboration/SharePanel";
import ThemeEditorPanel from "@/components/themes/ThemeEditorPanel";
import If from "jsx/if";
import { combine } from "reactivity";
import { handleError } from "@/utils/errors";
import styles from "./EditablePage.module.css";
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

  const isSidebarOpen = combine(
    {
      versionHistory: versionHistory.isOpen,
      share: share.isOpen,
      themeEditor: themeEditor.isOpen,
    },
    ({ versionHistory, share, themeEditor }) => versionHistory || share || themeEditor,
  );

  const bar = (
    <If condition={isEditable}>
      <div className={styles["bottom-bar"]} role="group" aria-label="Editor tools">
        <AIButton isOpen={editor.isPromptToolbarOpen} />
        <div id="toolbar-slot" className={styles["toolbar-slot"]}>
          <If condition={selection.derive((value) => value.size >= 2)}>
            <SelectionToolbar />
          </If>
          <If condition={editor.isPromptToolbarOpen}>
            <ChatPanel />
          </If>
        </div>
        <div id="insert-slot" />
      </div>
    </If>
  );

  return (
    <PageContents
      page={editor.page}
      isEditable={isEditable}
      showToolbar={showPageToolbar}
      tiles={editor.page.tiles}
      bar={bar}
      end={
        <>
          <If condition={versionHistory.isOpen}>
            <VersionHistoryPanel state={versionHistory} />
          </If>
          <If condition={share.isOpen}>
            <SharePanel state={share} editor={editor} />
          </If>
          <If condition={themeEditor.isOpen}>
            <ThemeEditorPanel state={themeEditor} />
          </If>
        </>
      }
      endVisible={isSidebarOpen}
    />
  );
}
