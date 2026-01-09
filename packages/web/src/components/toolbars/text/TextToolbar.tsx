import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FormattingTools from "@/components/toolbars/text/FormattingTools";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import AnimationIcon from "@/icons/animation.svg?jsx";
import StopIcon from "@/icons/stop.svg?jsx";
import FadeIcon from "@/icons/fade.svg?jsx";
import SlideIcon from "@/icons/slide.svg?jsx";
import GrowIcon from "@/icons/grow.svg?jsx";
import ShrinkIcon from "@/icons/shrink.svg?jsx";
import ExpandHeightIcon from "@/icons/expand-height.svg?jsx";
import { handleError } from "@/utils/errors";
import type Text from "@/models/Text";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { Animation } from "@/models/Tile";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "@/utils/reactivity";

export interface TextToolbarProps {
  text: Text;
  editorView: Reactive<EditorView | null>;
}

export default function TextToolbar({ text, editorView }: TextToolbarProps) {
  const { id, align, block, animation } = text;

  function toggleBlock() {
    let height: number | undefined = undefined;

    // Update the height value when changing from block layout
    if (block.value) {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const rowHeight = parseFloat(
          style.getPropertyValue("--grid-row-height"),
        );
        height = Math.ceil(rect.height / rowHeight);
      }
    }

    text
      .setSize({
        height,
        block: !block.value,
      })
      .catch(handleError);
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
        <TileTools tile={text} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={text} />
        <ToolbarGroup label="Layout">
          <ToolbarButton
            label="Size to fit contents"
            aria-pressed={block}
            on:click={toggleBlock}
          >
            <ExpandHeightIcon aria-hidden="true" />
          </ToolbarButton>

          {block.derive((value) =>
            !value ? (
              <list-select
                label="Vertical position"
                data-tooltip="Vertical position"
                aria-orientation="vertical"
                orientation="vertical"
                align="center"
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
            ) : null,
          )}

          <list-select
            label="Animation"
            data-tooltip="Animation"
            aria-orientation="vertical"
            orientation="vertical"
            align="center"
            value={animation}
            on:change={(event) =>
              text.setAnimation(
                (event.currentTarget as ListSelect).value as Animation,
              )
            }
          >
            <AnimationIcon aria-hidden="true" slot="default-icon" />
            <ListGroup>
              <ListOption icon={<StopIcon aria-hidden="true" />} value="">
                None
              </ListOption>
              <ListOption icon={<FadeIcon aria-hidden="true" />} value="FADE">
                Fade
              </ListOption>
              <ListOption icon={<SlideIcon aria-hidden="true" />} value="SLIDE">
                Slide
              </ListOption>
              <ListOption icon={<GrowIcon aria-hidden="true" />} value="GROW">
                Grow
              </ListOption>
              <ListOption
                icon={<ShrinkIcon aria-hidden="true" />}
                value="SHRINK"
              >
                Shrink
              </ListOption>
            </ListGroup>
          </list-select>
        </ToolbarGroup>
        <TileTools tile={text} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
