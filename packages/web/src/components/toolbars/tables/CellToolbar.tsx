import FormattingTools from "@/components/toolbars/text/FormattingTools";
import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { Reactive } from "@/utils/reactivity";

export interface CellToolbarProps {
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
}

export default function CellToolbar({ editorView, state }: CellToolbarProps) {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Cell tools"
    >
      <FormattingTools editorView={editorView} state={state} />
    </floating-toolbar>
  );
}
