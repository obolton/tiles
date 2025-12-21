import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import MenuItem from "@/components/buttons/MenuItem";
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
import PeopleIcon from "@/icons/people.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import ApproveIcon from "@/icons/approve.svg?jsx";
import RejectIcon from "@/icons/reject.svg?jsx";
import TextSizePopover from "@/components/formatting/TextSizePopover";
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
  approve,
  reject,
  togglePrompt,
  setTextSize,
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
    const dropdown = await Dropdown.create(Editor.current, {
      options: [{ value: defaultOption }],
    });
    performCommand(insertDropdown(dropdown.id, defaultOption));
  }

  function changeTextFormat(event: Event) {
    switch ((event.currentTarget as ListSelect).value) {
      case "h1":
        return performCommand(toggleHeading(1));
      case "h2":
        return performCommand(toggleHeading(2));
      case "h3":
        return performCommand(toggleHeading(3));
      case "code":
        return performCommand(toggleCode);
      case "unordered-list":
        return performCommand(toggleUnorderedList);
      case "ordered-list":
        return performCommand(toggleOrderedList);
      case "check-list":
        return performCommand(toggleCheckList);
      case "":
      default:
        return performCommand(resetBlockFormat);
    }
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

  const formatBold = () => performCommand(toggleBold);

  const formatItalic = () => performCommand(toggleItalic);

  const formatUnderline = () => performCommand(toggleUnderline);

  const formatStrikethrough = () => performCommand(toggleStrikethrough);

  const formatHighlight = () => performCommand(toggleHighlight);

  const approveSelection = () => performCommand(approve);

  const rejectSelection = () => performCommand(reject);

  const formatAlignment = (event: Event) =>
    performCommand(
      setAlignment((event.currentTarget as ListSelect).value as TextAlignment),
    );

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

        <popover-menu id="insert-content-menu" anchor="insert-content-button">
          <list-box>
            <ul className="menuitemgroup" role="group">
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<EventIcon aria-hidden="true" />}
                  on:click={insertNewDate}
                >
                  Date
                </MenuItem>
              </li>
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<DropdownIcon aria-hidden="true" />}
                  on:click={insertNewDropdown}
                >
                  Dropdown
                </MenuItem>
              </li>
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<PeopleIcon aria-hidden="true" />}
                  on:click={() => performCommand(openMentionPicker)}
                >
                  Mention
                </MenuItem>
              </li>

              <Each items={Editor.current.dropdowns}>
                {(dropdown) => (
                  <li>
                    <MenuItem
                      classList={{ menuitem: true }}
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
                  </li>
                )}
              </Each>
            </ul>
          </list-box>
        </popover-menu>
      </ToolbarGroup>

      <ToolbarGroup label="Heading">
        <list-select
          aria-label="Text format"
          aria-selected={format.derive((value) =>
            typeof value.headingLevel === "number" || value.code
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
              : value.code
                ? "code"
                : value.list
                  ? `${value.list}-list`
                  : "",
          )}
          on:change={changeTextFormat}
        >
          <ul className="menuitemgroup" role="group">
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true, [styles.h1]: true }}
                value="h1"
                data-label="Heading 1"
              >
                <H1Icon aria-hidden="true" />
                Heading 1
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true, [styles.h2]: true }}
                value="h2"
                data-label="Heading 2"
              >
                <H2Icon aria-hidden="true" />
                Heading 2
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true, [styles.h3]: true }}
                value="h3"
                data-label="Heading 3"
              >
                <H3Icon aria-hidden="true" />
                Heading 3
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true, [styles.code]: true }}
                value="code"
                data-label="Code"
              >
                <CodeIcon aria-hidden="true" />
                Code
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true }}
                value=""
                data-label="Paragraph"
              >
                <ParagraphIcon aria-hidden="true" />
                Paragraph
              </MenuItem>
            </li>
          </ul>

          <ul className="menuitemgroup" role="group">
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true }}
                value="unordered-list"
                data-label="Bulleted list"
              >
                <UnorderedListIcon aria-hidden="true" />
                Bulleted list
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true }}
                value="ordered-list"
                data-label="Numbered list"
              >
                <OrderedListIcon aria-hidden="true" />
                Numbered list
              </MenuItem>
            </li>
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true }}
                value="check-list"
                data-label="Check list"
              >
                <CheckListIcon aria-hidden="true" />
                Check list
              </MenuItem>
            </li>
          </ul>
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
          anchor="text-size-button"
          align="center"
          value={format.derive((value) => value.size)}
          onChange={changeTextSize}
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

        <list-select
          aria-label="Text alignment"
          data-tooltip="Text alignment"
          aria-orientation="vertical"
          orientation="horizontal"
          align="center"
          value={format.derive((value) => value.align)}
          on:change={formatAlignment}
        >
          <ul className="menuitemgroup inline" role="group">
            <li role="presentation">
              <MenuItem
                classList={{ floating: true }}
                icon={<AlignLeftIcon aria-hidden="true" />}
                value="left"
                label="Align left"
              />
            </li>

            <li role="presentation">
              <MenuItem
                classList={{ floating: true }}
                icon={<AlignCenterIcon aria-hidden="true" />}
                value="center"
                label="Align center"
              />
            </li>

            <li role="presentation">
              <MenuItem
                classList={{ floating: true }}
                icon={<AlignRightIcon aria-hidden="true" />}
                value="right"
                label="Align right"
              />
            </li>
          </ul>
        </list-select>
      </ToolbarGroup>
    </>
  );
}
