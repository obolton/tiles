import Prompt from "@/components/prompt/Prompt";
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
import NewIcon from "@/icons/new.svg?jsx";
import EventIcon from "@/icons/event.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import ApproveIcon from "@/icons/approve.svg?jsx";
import RejectIcon from "@/icons/reject.svg?jsx";
import { registerModal, showModal } from "@/utils/modals";
import { flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import type { DateTimeModalResult } from "@/components/modals/DateTimeModal";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type { EditorView } from "prosemirror-view";
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
  addLink,
  removeLink,
  setAlignment,
  insertDateTime,
  approve,
  reject,
} from "@/utils/richText/commands";
import { getLink } from "@/utils/richText/helpers";
import { insertFromStream } from "@/utils/richText/stream";
import type { Format, TextAlignment, ListType } from "@/utils/richText/format";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

registerModal("DATE_TIME", () => import("@/components/modals/DateTimeModal"));

const HEADING_ICON = [
  null,
  <H1Icon aria-hidden="true" slot="icon" />,
  <H2Icon aria-hidden="true" slot="icon" />,
  <H3Icon aria-hidden="true" slot="icon" />,
] as const;

const ALIGN_ICON = {
  left: <AlignLeftIcon aria-hidden="true" slot="icon" />,
  center: <AlignCenterIcon aria-hidden="true" slot="icon" />,
  right: <AlignRightIcon aria-hidden="true" slot="icon" />,
} as const;

const LIST_ICON = {
  unordered: <UnorderedListIcon aria-hidden="true" slot="icon" />,
  ordered: <OrderedListIcon aria-hidden="true" slot="icon" />,
  check: <CheckListIcon aria-hidden="true" slot="icon" />,
} as const;

interface FormattingToolbarProps {
  editor: Editor;
  format: Reactive<Format>;
  getEditorView: () => EditorView | undefined;
  performCommand: (command: Command) => void;
  children?: JSX.Node;
}

export default function FormattingToolbar({
  editor,
  getEditorView,
  performCommand,
  format,
  children,
}: FormattingToolbarProps) {
  const showPrompt = flag(false);

  const insertNewDate = () => {
    showModal<DateTimeModalResult>("DATE_TIME", {
      onConfirm({ value, time }) {
        performCommand(insertDateTime(value, time));
      },
    });
  };

  const formatHeading = (event: Event) => {
    switch ((event.currentTarget as SwatchSelect).value) {
      default:
      case "1":
        return performCommand(toggleHeading(1));
      case "2":
        return performCommand(toggleHeading(2));
      case "3":
        return performCommand(toggleHeading(3));
    }
  };

  const formatQuote = () => performCommand(toggleQuote);

  const formatLink = () => {
    const state = getEditorView()?.state;
    if (!state) {
      return;
    }

    const link = getLink(state);

    showModal<LinkModalResult>("LINK", {
      workspaceId: editor.workspaceId,
      url: link?.node.attrs.href,
      showPages: false,
      showRemove: !!link,
      onConfirm(result) {
        if (result && "url" in result) {
          performCommand(result.url ? addLink(result.url) : removeLink);
        }
      },
    });
  };

  const formatBold = () => performCommand(toggleBold);

  const formatItalic = () => performCommand(toggleItalic);

  const formatUnderline = () => performCommand(toggleUnderline);

  const formatStrikethrough = () => performCommand(toggleStrikethrough);

  const formatHighlight = () => performCommand(toggleHighlight);

  const approveSelection = () => performCommand(approve);

  const rejectSelection = () => performCommand(reject);

  const formatList = (event: Event) => {
    const listType = (event.currentTarget as SwatchSelect).value as ListType;
    switch (listType) {
      case "unordered":
        return performCommand(toggleUnorderedList);
      case "ordered":
        return performCommand(toggleOrderedList);
      case "check":
        return performCommand(toggleCheckList);
    }
  };

  const formatAlignment = (event: Event) =>
    performCommand(
      setAlignment(
        (event.currentTarget as SwatchSelect).value as TextAlignment,
      ),
    );

  const togglePrompt = () => {
    viewTransition(() => {
      showPrompt.toggle();
      if (!showPrompt.value) {
        getEditorView()?.focus();
      }
    });
  };

  const onSubmitPrompt = async (prompt: string) => {
    try {
      const view = getEditorView();
      if (!view) {
        return;
      }

      viewTransition(() => {
        showPrompt.off();
        view.focus();
      });

      const stream = await editor.write({ prompt });
      await insertFromStream(view, stream);
    } catch (error) {
      handleError(error);
    }
  };

  const onCancelPrompt = () => {
    viewTransition(() => {
      showPrompt.off();
      getEditorView()?.focus();
    });
  };

  return (
    <floating-toolbar
      aria-label="Formatting toolbar"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="AI tools">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating small"
            aria-label="Write with AI"
            data-tooltip="Write with AI"
            on:click={togglePrompt}
            aria-pressed={showPrompt.derive((value) =>
              value ? "true" : "false",
            )}
          >
            <AIIcon aria-hidden="true" />
          </button>
        </li>

        {format.derive((value) =>
          value.pending ? (
            <>
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Approve"
                  data-tooltip="Approve"
                  on:click={approveSelection}
                >
                  <ApproveIcon aria-hidden="true" />
                </button>
              </li>

              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Reject"
                  data-tooltip="Reject"
                  on:click={rejectSelection}
                >
                  <RejectIcon aria-hidden="true" />
                </button>
              </li>
            </>
          ) : null,
        )}
      </ul>

      {showPrompt.derive((value) =>
        value ? (
          <Prompt onSubmit={onSubmitPrompt} onCancel={onCancelPrompt} />
        ) : (
          <>
            <ul role="group" aria-label="Tools">
              <li role="presentation">
                <button
                  id="insert-content-button"
                  role="menuitem"
                  className="floating small"
                  popoverTarget="insert-content-menu"
                  aria-label="Insert content"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  data-tooltip="Insert content"
                  type="button"
                >
                  <NewIcon aria-hidden="true" />
                </button>

                <popover-menu
                  id="insert-content-menu"
                  anchor="insert-content-button"
                >
                  <menu>
                    <li>
                      <button type="button" on:click={insertNewDate}>
                        <EventIcon aria-hidden="true" />
                        Date
                      </button>
                    </li>
                  </menu>
                </popover-menu>
              </li>
            </ul>

            <ul role="group" aria-label="Heading">
              <li role="presentation">
                <swatch-select
                  role="menuitem"
                  aria-label="Heading"
                  aria-selected={format.derive((value) =>
                    typeof value.headingLevel === "number" ? "true" : undefined,
                  )}
                  data-tooltip="Heading"
                  orientation="horizontal"
                  align="center"
                  value={format.derive((value) =>
                    typeof value.headingLevel === "number"
                      ? value.headingLevel.toString()
                      : undefined,
                  )}
                  on:change={formatHeading}
                >
                  {format.derive(
                    (value) => HEADING_ICON[value.headingLevel ?? 1],
                  )}

                  <swatch-item value="1" data-tooltip="Heading level 1">
                    <H1Icon aria-hidden="true" />
                  </swatch-item>
                  <swatch-item value="2" data-tooltip="Heading level 2">
                    <H2Icon aria-hidden="true" />
                  </swatch-item>
                  <swatch-item value="3" data-tooltip="Heading level 3">
                    <H3Icon aria-hidden="true" />
                  </swatch-item>
                </swatch-select>
              </li>

              <li role="presentation">
                <swatch-select
                  role="menuitem"
                  aria-label="List"
                  data-tooltip="List"
                  orientation="horizontal"
                  align="center"
                  value={format.derive((value) => value.list ?? "")}
                  on:change={formatList}
                >
                  {format.derive((value) =>
                    value.list ? (
                      LIST_ICON[value.list]
                    ) : (
                      <UnorderedListIcon aria-hidden="true" slot="icon" />
                    ),
                  )}

                  <swatch-item value="unordered" data-tooltip="Unordered list">
                    <UnorderedListIcon aria-hidden="true" />
                  </swatch-item>
                  <swatch-item value="ordered" data-tooltip="Ordered list">
                    <OrderedListIcon aria-hidden="true" />
                  </swatch-item>
                  <swatch-item value="check" data-tooltip="Check list">
                    <CheckListIcon aria-hidden="true" />
                  </swatch-item>
                </swatch-select>
              </li>
            </ul>

            <ul role="group" aria-label="Text style">
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
                  on:click={formatBold}
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
                  on:click={formatItalic}
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
                  on:click={formatUnderline}
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
                  on:click={formatStrikethrough}
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
                  on:click={formatHighlight}
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
                  on:click={formatQuote}
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
                  on:click={formatLink}
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
                  align="center"
                  value={format.derive((value) => value.align)}
                  on:change={formatAlignment}
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

            {children}
          </>
        ),
      )}
    </floating-toolbar>
  );
}
