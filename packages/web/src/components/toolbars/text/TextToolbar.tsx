import MenuItem from "@/components/buttons/MenuItem";
import FormattingTools from "@/components/toolbars/text/FormattingTools";
import TileTools from "@/components/toolbars/tiles/TileTools";
import ColorPicker from "@/components/colors/ColorPicker";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
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
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Animation } from "@/models/Tile";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "@/utils/reactivity";

export interface TextToolbarProps {
  text: Text;
  editorView: Reactive<EditorView | null>;
}

export default function TextToolbar({ text, editorView }: TextToolbarProps) {
  const { id, textColor, background, align, block, animation } = text;

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
      data-tooltip-position="top"
    >
      <FormattingTools editorView={editorView} state={text.state} />

      <ul role="group" aria-label="Layout">
        <li role="presentation">
          <ColorPicker
            id={`${id}-color-picker`}
            value={textColor}
            onChange={(color) => text.setTextColor(color)}
          />
        </li>

        <li role="presentation">
          <BackgroundPicker
            id={`${text.id}-background`}
            value={background}
            onChange={(background) => text.setBackground(background)}
          />
        </li>

        <li role="presentation">
          <ToolbarButton
            label="Size to fit contents"
            aria-pressed={block}
            on:click={toggleBlock}
          >
            <ExpandHeightIcon aria-hidden="true" />
          </ToolbarButton>
        </li>

        {block.derive((value) =>
          !value ? (
            <li role="presentation">
              <swatch-select
                role="menuitem"
                aria-label="Vertical position"
                data-tooltip="Vertical position"
                aria-orientation="vertical"
                orientation="vertical"
                align="center"
                value={align}
                on:change={(event) =>
                  text.setVerticalAlignment(
                    (event.currentTarget as SwatchSelect).value as
                      | "TOP"
                      | "CENTER"
                      | "BOTTOM",
                  )
                }
              >
                <ul className="menuitemgroup" role="group">
                  <li role="presentation">
                    <MenuItem
                      classList={{ menuitem: true }}
                      icon={<VerticalAlignTopIcon aria-hidden="true" />}
                      value="TOP"
                    >
                      Top
                    </MenuItem>
                  </li>

                  <li role="presentation">
                    <MenuItem
                      classList={{ menuitem: true }}
                      icon={<VerticalAlignCenterIcon aria-hidden="true" />}
                      value="CENTER"
                    >
                      Center
                    </MenuItem>
                  </li>

                  <li role="presentation">
                    <MenuItem
                      classList={{ menuitem: true }}
                      icon={<VerticalAlignBottomIcon aria-hidden="true" />}
                      value="BOTTOM"
                    >
                      Bottom
                    </MenuItem>
                  </li>
                </ul>
              </swatch-select>
            </li>
          ) : null,
        )}

        <li role="presentation">
          <swatch-select
            role="menuitem"
            aria-label="Animation"
            data-tooltip="Animation"
            aria-orientation="vertical"
            orientation="vertical"
            align="center"
            value={animation}
            on:change={(event) =>
              text.setAnimation(
                (event.currentTarget as SwatchSelect).value as Animation,
              )
            }
          >
            <AnimationIcon aria-hidden="true" slot="default-icon" />
            <ul className="menuitemgroup" role="group">
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<StopIcon aria-hidden="true" />}
                  value=""
                >
                  None
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<FadeIcon aria-hidden="true" />}
                  value="FADE"
                >
                  Fade
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<SlideIcon aria-hidden="true" />}
                  value="SLIDE"
                >
                  Slide
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<GrowIcon aria-hidden="true" />}
                  value="GROW"
                >
                  Grow
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<ShrinkIcon aria-hidden="true" />}
                  value="SHRINK"
                >
                  Shrink
                </MenuItem>
              </li>
            </ul>
          </swatch-select>
        </li>
      </ul>

      <TileTools tile={text} />
    </floating-toolbar>
  );
}
