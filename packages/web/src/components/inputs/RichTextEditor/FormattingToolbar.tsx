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
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $createHeadingNode,
  $isHeadingNode,
  $createQuoteNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import type { HeadingTagType } from "@lexical/rich-text";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import H1Icon from "@/icons/h1.svg?jsx";
import H2Icon from "@/icons/h2.svg?jsx";
import H3Icon from "@/icons/h3.svg?jsx";
import BoldIcon from "@/icons/bold.svg?jsx";
import ItalicIcon from "@/icons/italic.svg?jsx";
import UnderlineIcon from "@/icons/underline.svg?jsx";
import StrikethroughIcon from "@/icons/strikethrough.svg?jsx";
import HighlightIcon from "@/icons/highlight.svg?jsx";
import OrderedListIcon from "@/icons/ordered-list.svg?jsx";
import UnorderedListIcon from "@/icons/unordered-list.svg?jsx";
import CheckListIcon from "@/icons/check-list.svg?jsx";
import QuoteIcon from "@/icons/quote.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { showModal } from "@/utils/modals";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import FloatingToolbar from "@/components/toolbars/FloatingToolbar";

type Format = {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  quote: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight?: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  checkList: boolean;
  link: boolean;
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
  if (listTypes.every((type) => type === "check")) {
    return "check";
  }
  return null;
}

interface ToolbarProps {
  className?: string;
  color: ColorPickerValue;
  onChangeColor: (value: ColorPickerValue) => void;
  expand: boolean;
  onToggleExpand: () => void;
}

export default function Toolbar({
  className,
  color,
  onChangeColor,
  expand,
  onToggleExpand,
}: ToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [format, setFormat] = useState<Format>({
    h1: false,
    h2: false,
    h3: false,
    quote: false,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    orderedList: false,
    unorderedList: false,
    checkList: false,
    link: false,
  });

  useEffect(() => {
    const unsubscribe = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        const anchor = selection.anchor.getNode();
        const topLevelElement = anchor.getTopLevelElement();

        const listType = $getSelectionListType();
        const isHeading = $isHeadingNode(topLevelElement);

        setFormat({
          h1: isHeading && topLevelElement.getTag() === "h1",
          h2: isHeading && topLevelElement.getTag() === "h2",
          h3: isHeading && topLevelElement.getTag() === "h3",
          quote: $isQuoteNode(topLevelElement),
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strikethrough: selection.hasFormat("strikethrough"),
          highlight: selection.hasFormat("highlight"),
          orderedList: listType === "ordered",
          unorderedList: listType === "unordered",
          checkList: listType === "check",
          link: $isLinkNode(anchor) || $isLinkNode(anchor.getParent()),
        });
      });
    });
    return () => unsubscribe();
  }, [editor]);

  const formatHeading = useCallback(
    (tag: HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        const anchor = $isRangeSelection(selection)
          ? selection?.anchor.getNode().getTopLevelElement()
          : null;
        if ($isHeadingNode(anchor) && anchor.getTag() === tag) {
          $setBlocksType(selection, $createParagraphNode);
        } else {
          $setBlocksType(selection, () => $createHeadingNode(tag));
        }
      });
    },
    [editor],
  );

  const formatH1 = useCallback(() => formatHeading("h1"), [formatHeading]);
  const formatH2 = useCallback(() => formatHeading("h2"), [formatHeading]);
  const formatH3 = useCallback(() => formatHeading("h3"), [formatHeading]);

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

  const formatLink = useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      const anchor = $isRangeSelection(selection)
        ? selection?.anchor.getNode()
        : null;
      const parent = anchor?.getParent();
      const linkNode = $isLinkNode(anchor)
        ? anchor
        : $isLinkNode(parent)
          ? parent
          : null;

      showModal<LinkModalResult>("LINK", {
        url: linkNode?.getURL(),
        showPages: false,
        showRemove: !!linkNode,
        async onConfirm(result) {
          if (result && "url" in result) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, result.url);
          }
        },
      });
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

  const formatHighlight = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "highlight"),
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

  const formatCheckList = useCallback(() => {
    editor.getEditorState().read(() => {
      if ($getSelectionListType() !== "check") {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    });
  }, [editor]);

  return (
    <FloatingToolbar className={className}>
      <li>
        <button
          className="floating small"
          aria-label="Heading level 1"
          data-tooltip="Format as heading level 1"
          type="button"
          aria-pressed={format.h1 ? "true" : "false"}
          onClick={formatH1}
        >
          <H1Icon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Heading level 2"
          data-tooltip="Format as heading level 2"
          type="button"
          aria-pressed={format.h2 ? "true" : "false"}
          onClick={formatH2}
        >
          <H2Icon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Heading level 3"
          data-tooltip="Format as heading level 3"
          type="button"
          aria-pressed={format.h3 ? "true" : "false"}
          onClick={formatH3}
        >
          <H3Icon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Bold"
          data-tooltip="Format as bold"
          type="button"
          aria-pressed={format.bold ? "true" : "false"}
          onClick={formatBold}
        >
          <BoldIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Italic"
          data-tooltip="Format as italic"
          type="button"
          aria-pressed={format.italic ? "true" : "false"}
          onClick={formatItalic}
        >
          <ItalicIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Underlined"
          data-tooltip="Format as underlined"
          type="button"
          aria-pressed={format.underline ? "true" : "false"}
          onClick={formatUnderline}
        >
          <UnderlineIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Strike-through"
          data-tooltip="Format as strike-through"
          type="button"
          aria-pressed={format.strikethrough ? "true" : "false"}
          onClick={formatStrikethrough}
        >
          <StrikethroughIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Highlight"
          data-tooltip="Format as highlighted"
          type="button"
          aria-pressed={format.highlight ? "true" : "false"}
          onClick={formatHighlight}
        >
          <HighlightIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Ordered list"
          data-tooltip="Format as an ordered list"
          type="button"
          aria-pressed={format.orderedList ? "true" : "false"}
          onClick={formatOrderedList}
        >
          <OrderedListIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Unordered list"
          data-tooltip="Format as an unordered list"
          type="button"
          aria-pressed={format.unorderedList ? "true" : "false"}
          onClick={formatUnorderedList}
        >
          <UnorderedListIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Check list"
          data-tooltip="Format as a check list"
          type="button"
          aria-pressed={format.checkList ? "true" : "false"}
          onClick={formatCheckList}
        >
          <CheckListIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Quote"
          data-tooltip="Format as a quote"
          type="button"
          aria-pressed={format.quote ? "true" : "false"}
          onClick={formatQuote}
        >
          <QuoteIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Link"
          data-tooltip="Add a link"
          type="button"
          aria-pressed={format.link ? "true" : "false"}
          onClick={formatLink}
        >
          <LinkIcon aria-hidden="true" />
        </button>
      </li>
      <li>
        <ColorPicker
          value={color}
          onChange={onChangeColor}
          aria-label="Color"
          data-tooltip="Select color"
          showClear
        />
      </li>
      <li>
        <button
          className="floating small"
          aria-label="Fit contents"
          data-tooltip="Fit contents"
          type="button"
          aria-pressed={expand ? "true" : "false"}
          onClick={onToggleExpand}
        >
          <ExpandIcon aria-hidden="true" />
        </button>
      </li>
    </FloatingToolbar>
  );
}
