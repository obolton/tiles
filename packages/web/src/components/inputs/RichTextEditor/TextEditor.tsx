import { useCallback, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import FormattingToolbar from "./FormattingToolbar";
import { selectionFormat } from "@/utils/richText/format";
import { deserialize } from "@/utils/richText/deserialize";
import { schema } from "@/utils/richText/schema";
import { getPlugins } from "@/utils/richText/plugins";
import { classNames } from "@/utils/css";
import type { Format } from "@/utils/richText/format";
import type { RichText } from "@/utils/richText/types";
import type { Command } from "prosemirror-state";

export type { EditorState };

interface TextEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onBlur"> {
  initialValue?: RichText | null;
  showToolbar?: boolean;
  extraToolbarItems?: React.ReactNode;
  onBlur?: (state: EditorState) => void;
}

export default function TextEditor({
  className,
  initialValue,
  onBlur,
  showToolbar = false,
  extraToolbarItems,
  ...props
}: TextEditorProps) {
  const editorViewRef = useRef<EditorView>(null);

  const refCallback = useCallback((element: HTMLElement | null) => {
    if (element) {
      const plugins = getPlugins().concat(selectionFormat(setFormat));
      editorViewRef.current = new EditorView(
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEditorState = useCallback(() => editorViewRef.current?.state, []);

  const performCommand = (command: Command) => {
    const view = editorViewRef.current;
    if (view) {
      command(view.state, view.dispatch, view);
    }
  };

  const handleBlur = useCallback(() => {
    if (editorViewRef.current && onBlur) {
      onBlur(editorViewRef.current?.state);
    }
  }, [onBlur]);

  const [format, setFormat] = useState<Format>({
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
        className={classNames("rich-text", className)}
        role="textbox"
        {...props}
        onBlur={handleBlur}
      />

      {showToolbar ? (
        <FormattingToolbar
          format={format}
          getEditorState={getEditorState}
          performCommand={performCommand}
        >
          {extraToolbarItems}
        </FormattingToolbar>
      ) : null}
    </>
  );
}
