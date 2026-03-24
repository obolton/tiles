import PageContents from "@/components/pages/PageContents";
import PageToolbar from "@/components/toolbars/pages/PageToolbar";
import DockZone from "@/components/docks/DockZone";
import InsertButton from "@/components/buttons/InsertButton";
import AIButton from "@/components/buttons/AIButton";
import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import PromptToolbar from "@/components/toolbars/prompt/PromptToolbar";
import Thread from "@/components/chat/Thread";
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
  const { tiles, dockedTiles } = editor.page;
  const style = editor.page.dockSizes.derive((sizes) => ({
    "--dock-top-size": `${sizes.TOP}px`,
    "--dock-bottom-size": `${sizes.BOTTOM}px`,
    "--dock-left-size": `${sizes.LEFT}px`,
    "--dock-right-size": `${sizes.RIGHT}px`,
  }));

  const showPageToolbar = combine(
    { selection, isEditable },
    ({ selection, isEditable }) => isEditable && selection.size === 0,
  );

  return (
    <>
      <div className={styles["page-layout"]} style={style}>
        <DockZone
          page={editor.page}
          isEditable={isEditable}
          edge="TOP"
          tiles={dockedTiles.TOP}
        />
        <DockZone
          page={editor.page}
          isEditable={isEditable}
          edge="LEFT"
          tiles={dockedTiles.LEFT}
        />
        <PageContents
          page={editor.page}
          isEditable={isEditable}
          tiles={tiles}
        />
        <DockZone
          page={editor.page}
          isEditable={isEditable}
          edge="RIGHT"
          tiles={dockedTiles.RIGHT}
        />
        <DockZone
          page={editor.page}
          isEditable={isEditable}
          edge="BOTTOM"
          tiles={dockedTiles.BOTTOM}
        />
      </div>

      <If condition={showPageToolbar}>
        <PageToolbar page={editor.page} />
      </If>

      <If condition={selection.derive((value) => value.size >= 2)}>
        <SelectionToolbar />
      </If>

      <If condition={editor.isPromptToolbarOpen}>
        <If condition={editor.chat.messages.derive((m) => m.length > 0)}>
          <Thread />
        </If>
        <PromptToolbar />
      </If>

      <If condition={isEditable}>
        <InsertButton id="insert-button" />
        <AIButton isOpen={editor.isPromptToolbarOpen} />
      </If>
    </>
  );
}
