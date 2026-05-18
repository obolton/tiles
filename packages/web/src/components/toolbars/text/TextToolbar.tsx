import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FormattingTools from "@/components/toolbars/text/FormattingTools";
import CodeTab from "@/components/toolbars/text/CodeTab";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import { getSelectionFormat, DEFAULT_FORMAT } from "@/utils/richText/format";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import If from "@/jsx/if";
import type Text from "@/models/Text";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { EditorView } from "prosemirror-view";
import type { Command } from "prosemirror-state";
import type { Reactive } from "@/utils/reactivity";

export interface TextToolbarProps {
  text: Text;
  editorView: Reactive<EditorView | null>;
}

export default function TextToolbar({ text, editorView }: TextToolbarProps) {
  const { align } = text;

  const format = text.state.derive((value) =>
    value ? getSelectionFormat(value) : DEFAULT_FORMAT,
  );

  function performCommand(command: Command) {
    const editor = editorView.value;
    if (editor) {
      command(editor.state, editor.dispatch, editor);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      aria-label="Text toolbar"
      data-tooltip-position="bottom"
      name="text-toolbar"
    >
      <toolbar-tab name="text" label="Text">
        <FormattingTools editorView={editorView} state={text.state} />
      </toolbar-tab>

      <If condition={format.derive((f) => f.codeBlock)}>
        <CodeTab format={format} performCommand={performCommand} />
      </If>

      <StyleTab tile={text}>
        <If condition={text.sizing.derive((d) => d !== "AUTO")}>
          <ToolbarGroup label="Vertical position">
            <list-select
              label="Vertical position"
              showvalue
              value={align}
              on:change={(event) =>
                text.setVerticalAlignment(
                  (event.currentTarget as ListSelect).value as
                    | "TOP"
                    | "CENTER"
                    | "BOTTOM",
                )
              }
            >
              <ListGroup>
                <ListOption
                  icon={<VerticalAlignTopIcon aria-hidden="true" />}
                  value="TOP"
                >
                  Top
                </ListOption>
                <ListOption
                  icon={<VerticalAlignCenterIcon aria-hidden="true" />}
                  value="CENTER"
                >
                  Center
                </ListOption>
                <ListOption
                  icon={<VerticalAlignBottomIcon aria-hidden="true" />}
                  value="BOTTOM"
                >
                  Bottom
                </ListOption>
              </ListGroup>
            </list-select>
          </ToolbarGroup>
        </If>
      </StyleTab>

      <DateTab tile={text} />
    </floating-toolbar>
  );
}
