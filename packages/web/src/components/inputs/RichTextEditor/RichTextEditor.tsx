import { handleError } from "@/utils/errors";
import { importNodes } from "@/utils/richText/deserialize";
import type { RichText } from "@/utils/richText/types";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  HEADING,
  ORDERED_LIST,
  UNORDERED_LIST,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from "@lexical/markdown";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode } from "@lexical/rich-text";
import type { EditorState, EditorThemeClasses, LexicalEditor } from "lexical";
import { useEffect, useRef } from "react";
import styles from "./RichTextEditor.module.css";

export type { EditorState };

const theme: EditorThemeClasses = {
  text: {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikethrough",
  },
};

const TRANSFORMERS = [
  HEADING,
  ORDERED_LIST,
  UNORDERED_LIST,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  STRIKETHROUGH,
];

interface RichTextEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  editable?: boolean;
  onChange: (editorState: EditorState) => void;
  value: RichText;
  placeholder?: string;
}

export default function RichTextEditor({
  children,
  className,
  editable,
  onChange,
  placeholder,
  value,
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
      nodes: [ListNode, ListItemNode, HeadingNode],
    };
  }

  useEffect(() => ref.current?.setEditable(editable ?? false), [editable]);

  return (
    <div className={className}>
      <LexicalComposer initialConfig={initialConfig.current}>
        {children}
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
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </LexicalComposer>
    </div>
  );
}
