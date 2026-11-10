import FormattingTools from "@/components/toolbars/text/FormattingTools";
import CodeTab from "@/components/toolbars/text/CodeTab";
import PageTab from "./PageTab";
import StyleTab from "./StyleTab";
import { getSelectionFormat, DEFAULT_FORMAT } from "@/utils/richText/format";
import If from "jsx/if";
import type Page from "@/models/Page";
import type { Command, EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "carillon";

export interface DocumentToolbarProps {
  page: Page;
  state: Reactive<EditorState | null>;
  editorView: Reactive<EditorView | null>;
}

/** Text formatting for the document body alongside the page settings. */
export default function DocumentToolbar({ page, state, editorView }: DocumentToolbarProps) {
  const format = state.derive((value) => (value ? getSelectionFormat(value) : DEFAULT_FORMAT));

  function performCommand(command: Command) {
    const editor = editorView.value;
    if (editor) {
      command(editor.state, editor.dispatch, editor);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      aria-label="Document toolbar"
      data-tooltip-position="bottom"
      name="document-toolbar"
    >
      <toolbar-tab name="text" label="Text">
        <FormattingTools editorView={editorView} state={state} />
      </toolbar-tab>

      <If condition={format.derive((f) => f.codeBlock)}>
        <CodeTab format={format} performCommand={performCommand} />
      </If>

      <PageTab page={page} />
      <StyleTab page={page} />
    </floating-toolbar>
  );
}
