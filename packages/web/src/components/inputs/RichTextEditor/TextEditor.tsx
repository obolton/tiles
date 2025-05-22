import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import FormattingToolbar from "./FormattingToolbar";
import { selectionFormat } from "@/utils/richText/format";
import { deserialize } from "@/utils/richText/deserialize";
import { schema } from "@/utils/richText/schema";
import { getPlugins } from "@/utils/richText/plugins";
import { handleError } from "@/utils/errors";
import styles from "./TextEditor.module.css";
import { ReactiveValue } from "@/utils/reactivity";
import type { Format } from "@/utils/richText/format";
import type { RichText } from "@/utils/richText/types";
import type { Command } from "prosemirror-state";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export type { EditorState };

interface TextEditorProps
  extends Omit<JSX.Attributes<HTMLDivElement>, "onBlur"> {
  initialValue?: RichText | null;
  showToolbar: Reactive<boolean>;
  extraToolbarItems?: JSX.Node;
  onBlur?: (state: EditorState) => void;
  signal?: AbortSignal;
}

export default function TextEditor({
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

  const getEditorState = () => editorView?.state;

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

  const format = new ReactiveValue<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    headingLevel: null,
    quote: false,
    orderedList: false,
    unorderedList: false,
    checkList: false,
    link: false,
  });

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
            format={format}
            getEditorState={getEditorState}
            performCommand={performCommand}
          >
            {extraToolbarItems}
          </FormattingToolbar>
        ) : null,
      )}
    </>
  );
}
