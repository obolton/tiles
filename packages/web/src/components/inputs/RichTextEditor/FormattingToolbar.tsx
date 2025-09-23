import H1Icon from "@/icons/h1.svg?jsx";
import H2Icon from "@/icons/h2.svg?jsx";
import H3Icon from "@/icons/h3.svg?jsx";
import ParagraphIcon from "@/icons/paragraph.svg?jsx";
import CodeIcon from "@/icons/code.svg?jsx";
import TextSizeIcon from "@/icons/text-size.svg?jsx";
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
import DropdownIcon from "@/icons/dropdown.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import ApproveIcon from "@/icons/approve.svg?jsx";
import RejectIcon from "@/icons/reject.svg?jsx";
import TextSizePopover from "@/components/formatting/TextSizePopover";
import { showModal } from "@/utils/modals";
import { classNames } from "@/utils/css";
import styles from "./FormattingToolbar.module.css";
import type { EditorView } from "prosemirror-view";
import type { Command } from "prosemirror-state";
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleHighlight,
  toggleQuote,
  toggleCode,
  toggleHeading,
  toggleOrderedList,
  toggleUnorderedList,
  toggleCheckList,
  resetBlockFormat,
  addLink,
  removeLink,
  setAlignment,
  insertDateTime,
  insertDropdown,
  approve,
  reject,
  togglePrompt,
  setTextSize,
} from "@/utils/richText/commands";
import { getLink } from "@/utils/richText/helpers";
import type { Format, TextAlignment, ListType } from "@/utils/richText/format";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

const DateTimeModalLoader = () => import("@/components/modals/DateTimeModal");
const DropdownModalLoader = () =>
  import("@/components/modals/dropdowns/DropdownModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");

const BLOCK_FORMAT_ICON = {
  paragraph: <ParagraphIcon aria-hidden="true" slot="icon" />,
  h1: <H1Icon aria-hidden="true" slot="icon" />,
  h2: <H2Icon aria-hidden="true" slot="icon" />,
  h3: <H3Icon aria-hidden="true" slot="icon" />,
  code: <CodeIcon aria-hidden="true" slot="icon" />,
} as const;

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

export interface FormattingToolbarProps {
  editor: Editor;
  format: Reactive<Format>;
  prompting: Reactive<boolean>;
  getEditorView: () => EditorView | null;
  performCommand: (command: Command) => void;
  children?: JSX.Node;
}

export default function FormattingToolbar({
  editor,
  getEditorView,
  performCommand,
  format,
  prompting,
  children,
}: FormattingToolbarProps) {
  function insertNewDate() {
    showModal(DateTimeModalLoader, {
      props: {},
      onConfirm({ value, time }) {
        performCommand(insertDateTime(value, time));
      },
    });
  }

  function insertNewDropdown() {
    showModal(DropdownModalLoader, {
      props: {},
      async onConfirm({ options }) {
        const dropdown = await editor.createDropdown({ options });
        performCommand(
          insertDropdown(dropdown.id, dropdown.options[0]?.value ?? ""),
        );
      },
    });
  }

  function changeTextFormat(event: Event) {
    switch ((event.currentTarget as SwatchSelect).value) {
      case "h1":
        return performCommand(toggleHeading(1));
      case "h2":
        return performCommand(toggleHeading(2));
      case "h3":
        return performCommand(toggleHeading(3));
      case "code":
        return performCommand(toggleCode);
      case "":
      default:
        return performCommand(resetBlockFormat);
    }
  }

  const formatQuote = () => performCommand(toggleQuote);

  const formatLink = () => {
    const state = getEditorView()?.state;
    if (!state) {
      return;
    }

    const link = getLink(state);

    showModal(LinkModalLoader, {
      props: {
        workspaceId: editor.workspaceId,
        url: link?.node.attrs.href,
        showPages: false,
        showRemove: !!link,
      },
      onConfirm(result) {
        if (result && "url" in result) {
          performCommand(result.url ? addLink(result.url) : removeLink);
        }
      },
    });
  };

  const changeTextSize = (size: number) => performCommand(setTextSize(size));

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

  const onTogglePrompt = () => performCommand(togglePrompt);

  return (
    <floating-toolbar
      className={classNames(styles.toolbar, "bottom-left")}
      aria-label="Formatting toolbar"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="AI tools">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
            aria-label="Write with AI"
            data-tooltip="Write with AI"
            aria-pressed={prompting.derive((value) =>
              value ? "true" : "false",
            )}
            on:click={onTogglePrompt}
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
                  className="floating"
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
                  className="floating"
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

      <ul role="group" aria-label="Tools">
        <li role="presentation">
          <button
            id="insert-content-button"
            role="menuitem"
            className="floating"
            popoverTarget="insert-content-menu"
            aria-label="Insert content"
            aria-haspopup="menu"
            aria-expanded="false"
            data-tooltip="Insert content"
            type="button"
          >
            <NewIcon aria-hidden="true" />
          </button>

          <popover-menu id="insert-content-menu" anchor="insert-content-button">
            <menu>
              <li>
                <button type="button" on:click={insertNewDate}>
                  <EventIcon aria-hidden="true" />
                  Date
                </button>
              </li>
              <li>
                <button type="button" on:click={insertNewDropdown}>
                  <DropdownIcon aria-hidden="true" />
                  Dropdown
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
            aria-label="Text format"
            aria-selected={format.derive((value) =>
              typeof value.headingLevel === "number" || value.code
                ? "true"
                : undefined,
            )}
            data-tooltip="Text format"
            orientation="vertical"
            align="center"
            value={format.derive((value) =>
              typeof value.headingLevel === "number"
                ? `h${value.headingLevel}`
                : value.code
                  ? "code"
                  : "",
            )}
            on:change={changeTextFormat}
          >
            {format.derive(
              (value) =>
                BLOCK_FORMAT_ICON[
                  typeof value.headingLevel === "number"
                    ? (`h${value.headingLevel}` as "h1" | "h2" | "h3")
                    : value.code
                      ? "code"
                      : "paragraph"
                ],
            )}

            <swatch-item className={styles.h1} value="h1">
              Heading 1
            </swatch-item>
            <swatch-item className={styles.h2} value="h2">
              Heading 2
            </swatch-item>
            <swatch-item className={styles.h3} value="h3">
              Heading 3
            </swatch-item>
            <swatch-item className={styles.code} value="code">
              Code
            </swatch-item>
            <swatch-item value="">Paragraph</swatch-item>
          </swatch-select>
        </li>

        <li role="presentation">
          <swatch-select
            role="menuitem"
            aria-label="List"
            aria-selected={format.derive((value) =>
              value.list ? "true" : undefined,
            )}
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
            type="button"
            role="menuitem"
            id="text-size-button"
            className="floating"
            aria-label="Text size"
            aria-haspopup="menu"
            aria-expanded="false"
            popovertarget="text-size-popover"
            data-tooltip="Text size"
          >
            <TextSizeIcon aria-hidden="true" />
          </button>

          <TextSizePopover
            id="text-size-popover"
            anchor="text-size-button"
            align="center"
            value={format.derive((value) => value.size)}
            onChange={changeTextSize}
          />
        </li>
        <li role="presentation">
          <button
            role="menuitem"
            className="floating"
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
            className="floating"
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
            className="floating"
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
            className="floating"
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
            className="floating"
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
            className="floating"
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
            className="floating"
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
    </floating-toolbar>
  );
}
