import { importNodes } from "@/utils/richText/deserialize";
import type { RichText } from "@/utils/richText/types";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import Toolbar from "./Toolbar";
import type { EditorState, EditorThemeClasses, LexicalEditor } from "lexical";
import { useEffect, useRef } from "react";
import { handleError } from "@/utils/errors";
import styles from "./RichTextEditor.module.css";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";

export type { EditorState };

const theme: EditorThemeClasses = {
  text: {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikethrough",
  },
};

interface RichTextEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  editable?: boolean;
  onChange: (editorState: EditorState) => void;
  value: RichText;
  placeholder?: string;
  color: ColorPickerValue;
  onChangeColor: (value: ColorPickerValue) => void;
}

export default function RichTextEditor({
  children,
  className,
  editable,
  onChange,
  placeholder,
  value,
  color,
  onChangeColor,
  ...props
}: RichTextEditorProps) {
  const ref = useRef<LexicalEditor>(null);

  const initialConfig = useRef<InitialConfigType>();
  if (!initialConfig.current) {
    initialConfig.current = {
      namespace: "tiles",
      theme,
      editable,
      editorState: () => importNodes(value),
      onError: handleError,
      nodes: [ListNode, ListItemNode],
    };
  }

  useEffect(() => ref.current?.setEditable(editable ?? false), [editable]);

  return (
    <div className={className}>
      <LexicalComposer initialConfig={initialConfig.current}>
        <Toolbar color={color} onChangeColor={onChangeColor} />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              {...props}
              data-editor="true"
              className={styles.editor}
              aria-placeholder={placeholder || ""}
              placeholder={
                <p data-placeholder="true" className={styles.placeholder}>
                  {placeholder}
                </p>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <EditorRefPlugin editorRef={ref} />
        <ListPlugin />
        <TabIndentationPlugin />
        {children}
      </LexicalComposer>
    </div>
  );
}
