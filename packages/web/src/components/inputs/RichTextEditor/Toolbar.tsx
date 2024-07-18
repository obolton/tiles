import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import Icon from "@/components/icons/Icon";
import boldIcon from "@/icons/bold.svg";
import italicIcon from "@/icons/italic.svg";
import underlineIcon from "@/icons/underline.svg";
import strikethroughIcon from "@/icons/strikethrough.svg";
import styles from "./Toolbar.module.css";

type Format = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
};

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState<DOMPoint | null>(null);
  const [visible, setVisible] = useState(false);
  const [format, setFormat] = useState<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  useEffect(() => {
    const unsubscribeHandlers = [
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || selection?.isCollapsed()) {
            return;
          }

          setFormat({
            bold: selection.hasFormat("bold"),
            italic: selection.hasFormat("italic"),
            underline: selection.hasFormat("underline"),
            strikethrough: selection.hasFormat("strikethrough"),
          });
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = getSelection();
          const range = selection?.getRangeAt(0);
          const rootElement = editor.getRootElement();

          if (!range || range.collapsed || !rootElement) {
            setVisible(false);
            return false;
          }

          const rect = range.getBoundingClientRect();
          const containerRect = rootElement.getBoundingClientRect();

          const position = new DOMPoint(
            rect.left + rect.width / 2 - containerRect.left,
            rect.top - containerRect.top,
          );
          setPosition(position);
          setVisible(true);

          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setVisible(false);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    ];

    return () => {
      unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
    };
  }, [editor]);

  const formatBold = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"),
    [editor],
  );

  const formatItalic = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"),
    [editor],
  );

  const formatUnderline = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline"),
    [editor],
  );

  const formatStrikethrough = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough"),
    [editor],
  );

  if (!position) {
    return null;
  }

  return (
    <menu
      className={`${styles.toolbar} ${visible ? "" : styles.hidden}`}
      style={
        {
          "--left": `${position.x}px`,
          "--top": `${position.y}px`,
        } as React.CSSProperties
      }
    >
      <li>
        <button
          aria-label="Format the text as bold"
          type="button"
          aria-pressed={format.bold ? "true" : "false"}
          onClick={formatBold}
        >
          <Icon src={boldIcon.src} />
        </button>
      </li>
      <li>
        <button
          aria-label="Format the text as italic"
          type="button"
          aria-pressed={format.italic ? "true" : "false"}
          onClick={formatItalic}
        >
          <Icon src={italicIcon.src} />
        </button>
      </li>
      <li>
        <button
          aria-label="Format the text as underlined"
          type="button"
          aria-pressed={format.underline ? "true" : "false"}
          onClick={formatUnderline}
        >
          <Icon src={underlineIcon.src} />
        </button>
      </li>
      <li>
        <button
          aria-label="Format the text as strike-through"
          type="button"
          aria-pressed={format.strikethrough ? "true" : "false"}
          onClick={formatStrikethrough}
        >
          <Icon src={strikethroughIcon.src} />
        </button>
      </li>
    </menu>
  );
}
