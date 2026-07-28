import PageContents from "@/components/pages/PageContents";
import PageToolbar from "@/components/toolbars/pages/PageToolbar";
import AIButton from "@/components/buttons/AIButton";
import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import ChatPanel from "@/components/chat/ChatPanel";
import VersionHistoryPanel from "@/components/versions/VersionHistoryPanel";
import If from "@/jsx/if";
import { combine } from "@/utils/reactivity";
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
  const { isEditable, selection } = editor;

  const showPageToolbar = combine(
    { selection, isEditable },
    ({ selection, isEditable }) => isEditable && selection.size === 0,
  );

  return (
    <>
      <If condition={isEditable}>
        <div className={styles["bottom-bar"]} role="group" aria-label="Editor tools">
          <AIButton isOpen={editor.isPromptToolbarOpen} />
          <div id="toolbar-slot" className={styles["toolbar-slot"]}>
            <If condition={showPageToolbar}>
              <PageToolbar page={editor.page} />
            </If>
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

      <PageContents
        page={editor.page}
        isEditable={isEditable}
        tiles={editor.page.tiles}
        end={<VersionHistoryPanel state={editor.versionHistory} />}
        endVisible={editor.versionHistory.isOpen}
      />
    </>
  );
}
