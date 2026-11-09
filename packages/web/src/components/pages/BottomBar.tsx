import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import CreateToolbar from "@/components/toolbars/CreateToolbar";
import ChatPanel from "@/components/chat/ChatPanel";
import If from "jsx/if";
import styles from "./BottomBar.module.css";
import type Editor from "@/editor/Editor";

export interface BottomBarProps {
  editor: Editor;
}

/** The editing chrome along the bottom of the viewport: the contextual toolbar slot and the create toolbar. */
export default function BottomBar({ editor }: BottomBarProps) {
  const { selection, isPromptToolbarOpen } = editor;

  return (
    <div className={styles.bar} role="group" aria-label="Editor tools">
      <div id="toolbar-slot" className={styles.slot}>
        <If condition={selection.derive((value) => value.size >= 2)}>
          <SelectionToolbar />
        </If>
      </div>
      <div className={styles.create}>
        <ChatPanel isOpen={isPromptToolbarOpen} />
        <CreateToolbar isPromptOpen={isPromptToolbarOpen} />
      </div>
    </div>
  );
}
