import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import ColorPicker from "@/components/inputs/ColorPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $createHeadingNode,
  $isHeadingNode,
  $createQuoteNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import Icon from "@/components/icons/Icon";
import headingIcon from "@/icons/heading.svg";
import boldIcon from "@/icons/bold.svg";
import italicIcon from "@/icons/italic.svg";
import underlineIcon from "@/icons/underline.svg";
import strikethroughIcon from "@/icons/strikethrough.svg";
import orderedListIcon from "@/icons/ordered-list.svg";
import unorderedListIcon from "@/icons/unordered-list.svg";
import quoteIcon from "@/icons/quote.svg";
import { classNames } from "@/utils/css";
import styles from "./Toolbar.module.css";

type Format = {
  heading: boolean;
  quote: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  orderedList: boolean;
  unorderedList: boolean;
};

function $getSelectionListType() {
  const selectedNodes = $getSelection()?.getNodes();
  if (!selectedNodes) {
    return null;
  }

  const listTypes = selectedNodes.map((node) => {
    const top = node.getTopLevelElement();
    return $isListNode(top) ? top.getListType() : null;
  });

  if (listTypes.every((type) => type === "number")) {
    return "ordered";
  }
  if (listTypes.every((type) => type === "bullet")) {
    return "unordered";
  }
  return null;
}

interface ToolbarProps {
  className?: string;
  color: ColorPickerValue;
  onChangeColor: (value: ColorPickerValue) => void;
}

export default function Toolbar({
  className,
  color,
  onChangeColor,
}: ToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [format, setFormat] = useState<Format>({
    heading: false,
    quote: false,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    orderedList: false,
    unorderedList: false,
  });

  useEffect(() => {
    const unsubscribe = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        const anchor = selection.anchor.getNode().getTopLevelElement();

        const listType = $getSelectionListType();

        setFormat({
          heading: $isHeadingNode(anchor),
          quote: $isQuoteNode(anchor),
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strikethrough: selection.hasFormat("strikethrough"),
          orderedList: listType === "ordered",
          unorderedList: listType === "unordered",
        });
      });
    });
    return () => unsubscribe();
  }, [editor]);

  const formatHeading = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      const anchor = $isRangeSelection(selection)
        ? selection?.anchor.getNode().getTopLevelElement()
        : null;
      if ($isHeadingNode(anchor)) {
        $setBlocksType(selection, $createParagraphNode);
      } else {
        $setBlocksType(selection, () => $createHeadingNode("h2"));
      }
    });
  }, [editor]);

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      const anchor = $isRangeSelection(selection)
        ? selection?.anchor.getNode().getTopLevelElement()
        : null;
      if ($isQuoteNode(anchor)) {
        $setBlocksType(selection, $createParagraphNode);
      } else {
        $setBlocksType(selection, $createQuoteNode);
      }
    });
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

  const formatOrderedList = useCallback(() => {
    editor.getEditorState().read(() => {
      if ($getSelectionListType() !== "ordered") {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    });
  }, [editor]);

  const formatUnorderedList = useCallback(() => {
    editor.getEditorState().read(() => {
      if ($getSelectionListType() !== "unordered") {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    });
  }, [editor]);

  return (
    <menu className={classNames(styles.toolbar, className)}>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as heading"
          type="button"
          aria-pressed={format.heading ? "true" : "false"}
          onClick={formatHeading}
        >
          <Icon src={headingIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as bold"
          type="button"
          aria-pressed={format.bold ? "true" : "false"}
          onClick={formatBold}
        >
          <Icon src={boldIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as italic"
          type="button"
          aria-pressed={format.italic ? "true" : "false"}
          onClick={formatItalic}
        >
          <Icon src={italicIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as underlined"
          type="button"
          aria-pressed={format.underline ? "true" : "false"}
          onClick={formatUnderline}
        >
          <Icon src={underlineIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as strike-through"
          type="button"
          aria-pressed={format.strikethrough ? "true" : "false"}
          onClick={formatStrikethrough}
        >
          <Icon src={strikethroughIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as an ordered list"
          type="button"
          aria-pressed={format.orderedList ? "true" : "false"}
          onClick={formatOrderedList}
        >
          <Icon src={orderedListIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as an unordered list"
          type="button"
          aria-pressed={format.unorderedList ? "true" : "false"}
          onClick={formatUnorderedList}
        >
          <Icon src={unorderedListIcon.src} />
        </button>
      </li>
      <li>
        <button
          className="floating small tooltip-top"
          aria-label="Format as a quote"
          type="button"
          aria-pressed={format.quote ? "true" : "false"}
          onClick={formatQuote}
        >
          <Icon src={quoteIcon.src} />
        </button>
      </li>
      <li>
        <ColorPicker
          value={color}
          onChange={onChangeColor}
          tooltipPosition="top"
          showClear
        />
      </li>
    </menu>
  );
}
