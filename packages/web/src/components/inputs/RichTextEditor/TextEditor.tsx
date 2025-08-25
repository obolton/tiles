import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import FormattingToolbar from "./FormattingToolbar";
import { selectionFormat } from "@/utils/richText/format";
import { prompt } from "@/utils/richText/prompt";
import { deserialize } from "@/utils/richText/deserialize";
import { schema } from "@/utils/richText/schema";
import { getPlugins } from "@/utils/richText/plugins";
import { handleError } from "@/utils/errors";
import styles from "./TextEditor.module.css";
import { reactive, flag } from "@/utils/reactivity";
import type { Format } from "@/utils/richText/format";
import type { RichText } from "@/utils/richText/types";
import type { Command } from "prosemirror-state";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

export type { EditorState };

interface TextEditorProps
  extends Omit<JSX.Attributes<HTMLDivElement>, "onBlur"> {
  editor: Editor;
  initialValue?: RichText | null;
  showToolbar: Reactive<boolean>;
  extraToolbarItems?: JSX.Node;
  onBlur?: (state: EditorState) => void;
  signal?: AbortSignal;
}

export default function TextEditor({
  editor,
  classList = [],
  initialValue,
  onBlur,
  showToolbar,
  extraToolbarItems,
  signal,
  ...props
}: TextEditorProps) {
  let editorView: EditorView | undefined;

  signal?.addEventListener(
    "abort",
    () => requestAnimationFrame(() => editorView?.destroy()),
    { once: true },
  );

  const ref = (element: HTMLElement) => {
    const plugins = getPlugins().concat(
      selectionFormat((newFormat) => {
        format.value = newFormat;
      }),
      prompt(editor, (open) => (prompting.value = open)),
    );
    try {
      const state = EditorState.create(
        initialValue
          ? {
              doc: deserialize(initialValue),
              plugins,
            }
          : { schema, plugins },
      );
      editorView = new EditorView({ mount: element }, { state });
    } catch (error) {
      handleError(error);
    }
  };

  const getEditorView = () => editorView;

  const performCommand = (command: Command) => {
    if (editorView) {
      command(editorView.state, editorView.dispatch, editorView);
    }
  };

  const handleBlur = () => {
    if (editorView && onBlur) {
      onBlur(editorView.state);
    }
  };

  const format = reactive<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    headingLevel: null,
    quote: false,
    list: null,
    link: false,
    pending: false,
  });
  const prompting = flag(false);

  return (
    <>
      <div
        {...props}
        ref={ref}
        classList={["rich-text", styles.editor, ...classList]}
        role="textbox"
        onblur={handleBlur}
      />

      {showToolbar.derive((value) =>
        value ? (
          <FormattingToolbar
            editor={editor}
            format={format}
            prompting={prompting}
            getEditorView={getEditorView}
            performCommand={performCommand}
          >
            {extraToolbarItems}
          </FormattingToolbar>
        ) : null,
      )}
    </>
  );
}
