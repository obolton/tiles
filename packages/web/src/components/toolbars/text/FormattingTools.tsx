import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import ColorPicker from "@/components/colors/ColorPicker";
import TextColorIcon from "@/icons/text-color.svg?jsx";
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
import MoreIcon from "@/icons/more.svg?jsx";
import SuperscriptIcon from "@/icons/superscript.svg?jsx";
import SubscriptIcon from "@/icons/subscript.svg?jsx";
import SmallCapsIcon from "@/icons/small-caps.svg?jsx";
import OrderedListIcon from "@/icons/ordered-list.svg?jsx";
import UnorderedListIcon from "@/icons/unordered-list.svg?jsx";
import CheckListIcon from "@/icons/check-list.svg?jsx";
import QuoteIcon from "@/icons/quote.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import AlignJustifyIcon from "@/icons/align-justify.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import EventIcon from "@/icons/event.svg?jsx";
import DropdownIcon from "@/icons/dropdown.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import DividerIcon from "@/icons/divider.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import ApproveIcon from "@/icons/approve.svg?jsx";
import RejectIcon from "@/icons/reject.svg?jsx";
import TextSizePopover from "@/components/formatting/TextSizePopover";
import LineHeightPopover from "@/components/formatting/LineHeightPopover";
import LineHeightIcon from "@/icons/line-height.svg?jsx";
import { DEFAULT_LINE_HEIGHT } from "@/constants/formatting";
import { getSelectionFormat, DEFAULT_FORMAT } from "@/utils/richText/format";
import { isPromptOpen } from "@/utils/richText/prompt";
import { showModal } from "@/utils/modals";
import Each from "@/jsx/each";
import styles from "./FormattingTools.module.css";
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleHighlight,
  toggleSuperscript,
  toggleSubscript,
  toggleSmallCaps,
  toggleInlineCode,
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
  openMentionPicker,
  insertDivider,
  approve,
  reject,
  togglePrompt,
  setTextSize,
  setTextColor,
  removeTextColor,
  setLineHeight,
} from "@/utils/richText/commands";
import { getLink } from "@/utils/richText/helpers";
import Editor from "@/editor/Editor";
import Dropdown from "@/models/Dropdown";
import type { Reactive } from "@/utils/reactivity";
import type { EditorState, Command } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { TextAlignment } from "@/utils/richText/format";
import type ListSelect from "@/elements/list-select/ListSelect";

const DateTimeModalLoader = () => import("@/components/modals/DateTimeModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");

export interface FormattingToolsProps {
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
}

export default function FormattingTools({
  editorView,
  state,
}: FormattingToolsProps) {
  const format = state.derive((value) =>
    value ? getSelectionFormat(value) : DEFAULT_FORMAT,
  );
  const prompting = state.derive((value) =>
    value ? isPromptOpen(value) : false,
  );

  function performCommand(command: Command) {
    const editor = editorView.value;
    if (editor) {
      command(editor.state, editor.dispatch, editor);
    }
  }

  function insertNewDate() {
    showModal(DateTimeModalLoader, {
      props: {},
      onConfirm({ value, time }) {
        performCommand(insertDateTime(value, time));
      },
    });
  }

  function insertExistingDropdown(id: string, value: string) {
    performCommand(insertDropdown(id, value));
  }

  async function insertNewDropdown() {
    const defaultOption = "Option 1";
    const dropdown = await Dropdown.create(Editor.current.page, {
      options: [{ value: defaultOption }],
    });
    performCommand(insertDropdown(dropdown.id, defaultOption));
  }

  function changeTextFormat(event: Event) {
    switch ((event.currentTarget as ListSelect).value) {
      case "h1":
        performCommand(toggleHeading(1));
        break;
      case "h2":
        performCommand(toggleHeading(2));
        break;
      case "h3":
        performCommand(toggleHeading(3));
        break;
      case "code":
        performCommand(toggleCode);
        break;
      case "unordered-list":
        performCommand(toggleUnorderedList);
        break;
      case "ordered-list":
        performCommand(toggleOrderedList);
        break;
      case "check-list":
        performCommand(toggleCheckList);
        break;
      case "":
      default:
        performCommand(resetBlockFormat);
        break;
    }
    editorView.value?.focus();
  }

  const formatQuote = () => performCommand(toggleQuote);

  const formatLink = () => {
    const stateValue = state.value;
    if (!stateValue) {
      return;
    }

    const link = getLink(stateValue);

    showModal(LinkModalLoader, {
      props: {
        workspaceId: Editor.current.workspaceId,
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

  const changeLineHeight = (value: number) =>
    performCommand(
      setLineHeight(value === DEFAULT_LINE_HEIGHT ? undefined : value),
    );

  const changeTextColor = (color: string) =>
    performCommand(setTextColor(color));

  const clearTextColor = () => performCommand(removeTextColor);

  const formatBold = () => performCommand(toggleBold);

  const formatItalic = () => performCommand(toggleItalic);

  const formatUnderline = () => performCommand(toggleUnderline);

  const formatStrikethrough = () => performCommand(toggleStrikethrough);

  const formatHighlight = () => performCommand(toggleHighlight);

  const formatSuperscript = () => performCommand(toggleSuperscript);

  const formatSubscript = () => performCommand(toggleSubscript);

  const formatSmallCaps = () => performCommand(toggleSmallCaps);

  const formatInlineCode = () => performCommand(toggleInlineCode);

  const approveSelection = () => performCommand(approve);

  const rejectSelection = () => performCommand(reject);

  const formatAlignment = (event: Event) => {
    performCommand(
      setAlignment((event.currentTarget as ListSelect).value as TextAlignment),
    );
    editorView.value?.focus();
  };

  const onTogglePrompt = () => performCommand(togglePrompt);

  const listFormatter = new Intl.ListFormat(undefined, {
    type: "unit",
    style: "short",
  });

  return (
    <>
      <ToolbarGroup label="AI tools">
        <ToolbarButton
          label="Write with AI"
          aria-pressed={prompting}
          on:click={onTogglePrompt}
        >
          <AIIcon aria-hidden="true" />
        </ToolbarButton>

        {format.derive((value) =>
          value.pending ? (
            <>
              <ToolbarButton label="Approve" on:click={approveSelection}>
                <ApproveIcon aria-hidden="true" />
              </ToolbarButton>

              <ToolbarButton label="Reject" on:click={rejectSelection}>
                <RejectIcon aria-hidden="true" />
              </ToolbarButton>
            </>
          ) : null,
        )}
      </ToolbarGroup>

      <ToolbarGroup label="Tools">
        <ToolbarButton
          id="insert-content-button"
          popovertarget="insert-content-menu"
          label="Insert content"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <NewIcon aria-hidden="true" />
        </ToolbarButton>

        <popover-menu id="insert-content-menu">
          <MenuItemGroup>
            <MenuItem
              icon={<EventIcon aria-hidden="true" />}
              on:click={insertNewDate}
            >
              Date
            </MenuItem>
            <MenuItem
              icon={<DropdownIcon aria-hidden="true" />}
              on:click={insertNewDropdown}
            >
              Dropdown
            </MenuItem>
            <MenuItem
              icon={<PeopleIcon aria-hidden="true" />}
              on:click={() => performCommand(openMentionPicker)}
            >
              Mention
            </MenuItem>
            <MenuItem
              icon={<DividerIcon aria-hidden="true" />}
              on:click={() => performCommand(insertDivider)}
            >
              Divider
            </MenuItem>

            <Each items={Editor.current.page.dropdowns}>
              {(dropdown) => (
                <MenuItem
                  icon={<DropdownIcon aria-hidden="true" />}
                  on:click={() =>
                    insertExistingDropdown(
                      dropdown.id,
                      dropdown.options.value[0]?.value ?? "",
                    )
                  }
                >
                  {dropdown.title.value ||
                    listFormatter.format(
                      dropdown.options.value
                        .slice(0, 5)
                        .map(({ value }) => value),
                    )}
                </MenuItem>
              )}
            </Each>
          </MenuItemGroup>
        </popover-menu>
      </ToolbarGroup>

      <ToolbarGroup label="Heading">
        <list-select
          aria-label="Text format"
          aria-selected={format.derive((value) =>
            typeof value.headingLevel === "number" || value.codeBlock
              ? "true"
              : undefined,
          )}
          data-tooltip="Text format"
          orientation="vertical"
          align="center"
          showvalue
          value={format.derive((value) =>
            typeof value.headingLevel === "number"
              ? `h${value.headingLevel}`
              : value.codeBlock
                ? "code"
                : value.list
                  ? `${value.list}-list`
                  : "",
          )}
          on:change={changeTextFormat}
        >
          <ListGroup>
            <ListOption
              classList={{ [styles.h1]: true }}
              icon={<H1Icon aria-hidden="true" />}
              value="h1"
            >
              Heading 1
            </ListOption>
            <ListOption
              classList={{ [styles.h2]: true }}
              icon={<H2Icon aria-hidden="true" />}
              value="h2"
            >
              Heading 2
            </ListOption>
            <ListOption
              classList={{ [styles.h3]: true }}
              icon={<H3Icon aria-hidden="true" />}
              value="h3"
            >
              Heading 3
            </ListOption>
            <ListOption
              classList={{ [styles.code]: true }}
              icon={<CodeIcon aria-hidden="true" />}
              value="code"
            >
              Code
            </ListOption>
            <ListOption icon={<ParagraphIcon aria-hidden="true" />} value="">
              Paragraph
            </ListOption>
          </ListGroup>

          <ListGroup>
            <ListOption
              icon={<UnorderedListIcon aria-hidden="true" />}
              value="unordered-list"
            >
              Bulleted list
            </ListOption>
            <ListOption
              icon={<OrderedListIcon aria-hidden="true" />}
              value="ordered-list"
            >
              Numbered list
            </ListOption>
            <ListOption
              icon={<CheckListIcon aria-hidden="true" />}
              value="check-list"
            >
              Check list
            </ListOption>
          </ListGroup>
        </list-select>
      </ToolbarGroup>

      <ToolbarGroup label="Text style">
        <ToolbarButton
          id="text-size-button"
          label="Text size"
          aria-haspopup="menu"
          aria-expanded="false"
          popovertarget="text-size-popover"
        >
          <TextSizeIcon aria-hidden="true" />
        </ToolbarButton>

        <TextSizePopover
          id="text-size-popover"
          align="center"
          value={format.derive((value) => value.size)}
          onChange={changeTextSize}
        />

        <ToolbarButton
          id="line-height-button"
          label="Line height"
          aria-haspopup="menu"
          aria-expanded="false"
          popovertarget="line-height-popover"
        >
          <LineHeightIcon aria-hidden="true" />
        </ToolbarButton>

        <LineHeightPopover
          id="line-height-popover"
          align="center"
          value={format.derive(
            (value) => value.lineHeight ?? DEFAULT_LINE_HEIGHT,
          )}
          onChange={changeLineHeight}
        />

        <ToolbarButton
          label="Bold"
          aria-pressed={format.derive((value) => value.bold)}
          on:click={formatBold}
        >
          <BoldIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          aria-pressed={format.derive((value) => value.italic)}
          on:click={formatItalic}
        >
          <ItalicIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Underlined"
          aria-pressed={format.derive((value) => value.underline)}
          on:click={formatUnderline}
        >
          <UnderlineIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Strike-through"
          aria-pressed={format.derive((value) => value.strikethrough)}
          on:click={formatStrikethrough}
        >
          <StrikethroughIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Highlight"
          aria-pressed={format.derive((value) => value.highlight)}
          on:click={formatHighlight}
        >
          <HighlightIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Code"
          aria-pressed={format.derive((value) => value.code)}
          on:click={formatInlineCode}
        >
          <CodeIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          id="more-text-button"
          popovertarget="more-text-menu"
          label="More formatting"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <MoreIcon aria-hidden="true" />
        </ToolbarButton>

        <popover-menu id="more-text-menu">
          <MenuItemGroup label="Position">
            <MenuItem
              role="menuitemradio"
              icon={<SuperscriptIcon aria-hidden="true" />}
              checked={format.derive((f) => f.superscript)}
              on:click={formatSuperscript}
            >
              Superscript
            </MenuItem>
            <MenuItem
              role="menuitemradio"
              icon={<SubscriptIcon aria-hidden="true" />}
              checked={format.derive((f) => f.subscript)}
              on:click={formatSubscript}
            >
              Subscript
            </MenuItem>
          </MenuItemGroup>
          <MenuItemGroup label="Variant">
            <MenuItem
              icon={<SmallCapsIcon aria-hidden="true" />}
              checked={format.derive((f) => f.smallCaps)}
              on:click={formatSmallCaps}
            >
              Small caps
            </MenuItem>
          </MenuItemGroup>
        </popover-menu>

        <ToolbarButton
          label="Quote"
          aria-pressed={format.derive((value) => value.quote)}
          on:click={formatQuote}
        >
          <QuoteIcon aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          label="Link"
          aria-pressed={format.derive((value) => value.link)}
          on:click={formatLink}
        >
          <LinkIcon aria-hidden="true" />
        </ToolbarButton>

        <ColorPicker
          id="inline-text-color"
          icon={<TextColorIcon aria-hidden="true" />}
          value={format.derive((value) => value.color)}
          onChange={changeTextColor}
          showClear
          onClear={clearTextColor}
        />

        <list-select
          aria-label="Text alignment"
          aria-disabled={format.derive((value) =>
            value.align === undefined ? "true" : undefined,
          )}
          data-tooltip="Text alignment"
          orientation="horizontal"
          align="center"
          value={format.derive((value) => value.align ?? "left")}
          on:change={formatAlignment}
        >
          <ListGroup>
            <ListOption
              icon={<AlignLeftIcon aria-hidden="true" />}
              value="left"
              label="Align left"
            />
            <ListOption
              icon={<AlignCenterIcon aria-hidden="true" />}
              value="center"
              label="Align center"
            />
            <ListOption
              icon={<AlignRightIcon aria-hidden="true" />}
              value="right"
              label="Align right"
            />
            <ListOption
              icon={<AlignJustifyIcon aria-hidden="true" />}
              value="justify"
              label="Justify"
            />
          </ListGroup>
        </list-select>
      </ToolbarGroup>
    </>
  );
}
