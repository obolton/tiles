import { handleError } from "@/utils/errors";
import { importPlainText } from "@/utils/richText/deserialize";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { $getRoot } from "lexical";
import type { EditorState } from "lexical";
import { useCallback, useRef } from "react";
import { classNames } from "@/utils/css";
import styles from "./PlainTextEditor.module.css";

export type { EditorState };

interface PlainTextEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  editable?: boolean;
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
}

export default function PlainTextEditor({
  children,
  className,
  editable,
  onChange,
  placeholder,
  value,
  ...props
}: PlainTextEditorProps) {
  const initialConfig = useRef<InitialConfigType>();
  if (!initialConfig.current) {
    initialConfig.current = {
      namespace: "tiles",
      editable,
      editorState: () => importPlainText(value),
      onError: handleError,
    };
  }

  const handleChange = useCallback(
    (state: EditorState) => {
      const value = state.read(() => $getRoot().getTextContent());
      onChange(value);
    },
    [onChange],
  );

  return (
    <div className={classNames(styles.editor, className)}>
      <LexicalComposer initialConfig={initialConfig.current}>
        {children}
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              {...props}
              className={styles.content}
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
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}
