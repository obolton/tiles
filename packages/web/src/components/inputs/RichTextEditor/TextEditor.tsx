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

interface TextEditorProps extends JSX.Attributes<HTMLDivElement> {
  editor: Editor;
  state: Reactive<EditorState | null>;
  initialValue?: RichText | null;
  showToolbar: Reactive<boolean>;
  extraToolbarItems?: JSX.Node;
  signal?: AbortSignal;
}

export default function TextEditor({
  editor,
  state,
  classList = [],
  initialValue,
  showToolbar,
  extraToolbarItems,
  signal,
  ...props
}: TextEditorProps) {
  let editorView: EditorView | null = null;

  signal?.addEventListener(
    "abort",
    () =>
      requestAnimationFrame(() => {
        editorView?.destroy();
        editorView = null;
      }),
    { once: true },
  );

  function createState() {
    const plugins = getPlugins().concat(
      selectionFormat((newFormat) => {
        format.value = newFormat;
      }),
      prompt(editor, (open) => (prompting.value = open)),
    );
    const config = initialValue
      ? { doc: deserialize(initialValue), plugins }
      : { schema, plugins };
    return EditorState.create(config);
  }

  const ref = (element: HTMLElement) => {
    try {
      if (!state.value) {
        state.value = createState();
      }
      const view = new EditorView(
        { mount: element },
        {
          state: state.value,
          dispatchTransaction(tr) {
            const newState = view.state.apply(tr);
            view.updateState(newState);
            state.value = newState;
          },
        },
      );

      // Apply external state changes
      state.subscribe(() => {
        if (state.value && state.value !== view.state) {
          view.updateState(state.value);
        }
      }, signal);
      editorView = view;
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
