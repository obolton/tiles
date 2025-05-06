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
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import { showModal } from "@/utils/modals";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import FloatingToolbar from "@/components/toolbars/FloatingToolbar";
import type { EditorState } from "prosemirror-state";
import type { Command } from "prosemirror-state";
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleHighlight,
  toggleQuote,
  toggleHeading,
  toggleOrderedList,
  toggleUnorderedList,
  toggleCheckList,
  toggleLink,
  removeLink,
  setAlignment,
} from "@/utils/richText/commands";
import type { Format, TextAlignment } from "@/utils/richText/format";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";
import type { StoreInterface } from "@/utils/stores";

const ALIGN_ICON = {
  left: <AlignLeftIcon aria-hidden="true" slot="icon" />,
  center: <AlignCenterIcon aria-hidden="true" slot="icon" />,
  right: <AlignRightIcon aria-hidden="true" slot="icon" />,
};

interface FormattingToolbarProps {
  format: StoreInterface<Format>;
  getEditorState: () => EditorState | undefined;
  performCommand: (command: Command) => void;
  children?: JSX.Node;
}

export default function FormattingToolbar({
  getEditorState,
  performCommand,
  format,
  children,
}: FormattingToolbarProps) {
  const formatH1 = () => performCommand(toggleHeading(1));
  const formatH2 = () => performCommand(toggleHeading(2));
  const formatH3 = () => performCommand(toggleHeading(3));

  const formatQuote = () => performCommand(toggleQuote);

  const formatLink = () => {
    const state = getEditorState();
    if (!state) {
      return;
    }

    const link = state.selection.$from
      .marks()
      .find((mark) => mark.type.name === "link");

    showModal<LinkModalResult>("LINK", {
      url: link?.attrs.href,
      showPages: false,
      showRemove: !!link,
      async onConfirm(result) {
        if (result && "url" in result) {
          performCommand(result.url ? toggleLink(result.url) : removeLink);
        }
      },
    });
  };

  const formatBold = () => performCommand(toggleBold);

  const formatItalic = () => performCommand(toggleItalic);

  const formatUnderline = () => performCommand(toggleUnderline);

  const formatStrikethrough = () => performCommand(toggleStrikethrough);

  const formatHighlight = () => performCommand(toggleHighlight);

  const formatOrderedList = () => performCommand(toggleOrderedList);

  const formatUnorderedList = () => performCommand(toggleUnorderedList);

  const formatCheckList = () => performCommand(toggleCheckList);

  const formatAlignment = (event: Event) =>
    performCommand(
      setAlignment(
        (event.currentTarget as SwatchSelect).value as TextAlignment,
      ),
    );

  return (
    <FloatingToolbar>
      <ul role="group">
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Heading level 1"
            data-tooltip="Format as heading level 1"
            type="button"
            aria-pressed={format.derive((value) =>
              value.h1 ? "true" : "false",
            )}
            onclick={formatH1}
          >
            <H1Icon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Heading level 2"
            data-tooltip="Format as heading level 2"
            type="button"
            aria-pressed={format.derive((value) =>
              value.h2 ? "true" : "false",
            )}
            onclick={formatH2}
          >
            <H2Icon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Heading level 3"
            data-tooltip="Format as heading level 3"
            type="button"
            aria-pressed={format.derive((value) =>
              value.h3 ? "true" : "false",
            )}
            onclick={formatH3}
          >
            <H3Icon aria-hidden="true" />
          </button>
        </li>
      </ul>

      <ul role="group">
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Bold"
            data-tooltip="Format as bold"
            type="button"
            aria-pressed={format.derive((value) =>
              value.bold ? "true" : "false",
            )}
            onclick={formatBold}
          >
            <BoldIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Italic"
            data-tooltip="Format as italic"
            type="button"
            aria-pressed={format.derive((value) =>
              value.italic ? "true" : "false",
            )}
            onclick={formatItalic}
          >
            <ItalicIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Underlined"
            data-tooltip="Format as underlined"
            type="button"
            aria-pressed={format.derive((value) =>
              value.underline ? "true" : "false",
            )}
            onclick={formatUnderline}
          >
            <UnderlineIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Strike-through"
            data-tooltip="Format as strike-through"
            type="button"
            aria-pressed={format.derive((value) =>
              value.strikethrough ? "true" : "false",
            )}
            onclick={formatStrikethrough}
          >
            <StrikethroughIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Highlight"
            data-tooltip="Format as highlighted"
            type="button"
            aria-pressed={format.derive((value) =>
              value.highlight ? "true" : "false",
            )}
            onclick={formatHighlight}
          >
            <HighlightIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Quote"
            data-tooltip="Format as a quote"
            type="button"
            aria-pressed={format.derive((value) =>
              value.quote ? "true" : "false",
            )}
            onclick={formatQuote}
          >
            <QuoteIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Link"
            data-tooltip="Add a link"
            type="button"
            aria-pressed={format.derive((value) =>
              value.link ? "true" : "false",
            )}
            onclick={formatLink}
          >
            <LinkIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <swatch-select
            role="menuitem"
            aria-label="Text alignment"
            data-tooltip="Text alignment"
            aria-orientation="vertical"
            orientation="horizontal"
            direction="up"
            value={format.derive((value) => value.align)}
            onchange={formatAlignment}
          >
            {format.derive((value) =>
              value.align ? (
                ALIGN_ICON[value.align]
              ) : (
                <AlignLeftIcon aria-hidden="true" slot="icon" />
              ),
            )}

            <swatch-item value="left" data-tooltip="Align left">
              <AlignLeftIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="center" data-tooltip="Align center">
              <AlignCenterIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="right" data-tooltip="Align right">
              <AlignRightIcon aria-hidden="true" />
            </swatch-item>
          </swatch-select>
        </li>
      </ul>

      <ul role="group">
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Ordered list"
            data-tooltip="Format as an ordered list"
            type="button"
            aria-pressed={format.derive((value) =>
              value.orderedList ? "true" : "false",
            )}
            onclick={formatOrderedList}
          >
            <OrderedListIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Unordered list"
            data-tooltip="Format as an unordered list"
            type="button"
            aria-pressed={format.derive((value) =>
              value.unorderedList ? "true" : "false",
            )}
            onclick={formatUnorderedList}
          >
            <UnorderedListIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating small"
            aria-label="Check list"
            data-tooltip="Format as a check list"
            type="button"
            aria-pressed={format.derive((value) =>
              value.checkList ? "true" : "false",
            )}
            onclick={formatCheckList}
          >
            <CheckListIcon aria-hidden="true" />
          </button>
        </li>
      </ul>

      {children}
    </FloatingToolbar>
  );
}
