import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import FormattingToolbar from "./FormattingToolbar";
import { selectionFormat } from "@/utils/richText/format";
import { deserialize } from "@/utils/richText/deserialize";
import { schema } from "@/utils/richText/schema";
import { getPlugins } from "@/utils/richText/plugins";
import { handleError } from "@/utils/errors";
import styles from "./TextEditor.module.css";
import { Store } from "@/utils/stores";
import type { Format } from "@/utils/richText/format";
import type { RichText } from "@/utils/richText/types";
import type { Command } from "prosemirror-state";
import type { JSX } from "@/jsx/jsx";
import type { StoreInterface } from "@/utils/stores";

export type { EditorState };

interface TextEditorProps
  extends Omit<JSX.Attributes<HTMLDivElement>, "onBlur"> {
  initialValue?: RichText | null;
  showToolbar: StoreInterface<boolean>;
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

  signal?.addEventListener("abort", () => editorView?.destroy(), {
    once: true,
  });

  const refCallback = (element: HTMLElement) => {
    const plugins = getPlugins().concat(
      selectionFormat((newFormat) => {
        format.value = newFormat;
      }),
    );
    try {
      editorView = new EditorView(
        { mount: element },
        {
          state: EditorState.create(
            initialValue
              ? {
                  doc: deserialize(initialValue),
                  plugins,
                }
              : { schema, plugins },
          ),
        },
      );
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

  const format = new Store<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    h1: false,
    h2: false,
    h3: false,
    quote: false,
    orderedList: false,
    unorderedList: false,
    checkList: false,
    link: false,
  });

  return (
    <>
      <div
        ref={refCallback}
        classList={["rich-text", styles.editor, ...classList]}
        role="textbox"
        {...props}
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
