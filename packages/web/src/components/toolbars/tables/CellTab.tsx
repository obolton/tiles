import FormattingTools from "@/components/toolbars/text/FormattingTools";
import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { Reactive } from "carillon";

export interface CellTabProps {
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
}

export default function CellTab({ editorView, state }: CellTabProps) {
  return (
    <toolbar-tab name="range" label="Cell">
      <FormattingTools editorView={editorView} state={state} />
    </toolbar-tab>
  );
}
