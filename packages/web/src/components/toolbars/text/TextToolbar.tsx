import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FormattingTools from "@/components/toolbars/text/FormattingTools";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import DateTab from "@/components/toolbars/tiles/DateTab";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import If from "@/jsx/if";
import type Text from "@/models/Text";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "@/utils/reactivity";

export interface TextToolbarProps {
  text: Text;
  editorView: Reactive<EditorView | null>;
}

export default function TextToolbar({ text, editorView }: TextToolbarProps) {
  const { align } = text;

  return (
    <floating-toolbar
      className="primary"
      aria-label="Text toolbar"
      data-tooltip-position="bottom"
      name="text-toolbar"
    >
      <toolbar-tab name="text" label="Text">
        <FormattingTools editorView={editorView} state={text.state} />
        <TileTools tile={text} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={text} />
        <If condition={text.sizing.derive((d) => d !== "AUTO")}>
          <ToolbarGroup label="Layout">
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
      </toolbar-tab>

      <DateTab tile={text} />
    </floating-toolbar>
  );
}
