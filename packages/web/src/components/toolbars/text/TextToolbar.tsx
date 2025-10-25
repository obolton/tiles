import FormattingTools from "@/components/inputs/RichTextEditor/FormattingTools";
import ColorPicker from "@/components/colors/ColorPicker";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import AnimationIcon from "@/icons/animation.svg?jsx";
import FadeIcon from "@/icons/fade.svg?jsx";
import SlideIcon from "@/icons/slide.svg?jsx";
import GrowIcon from "@/icons/grow.svg?jsx";
import ShrinkIcon from "@/icons/shrink.svg?jsx";
import ExpandHeightIcon from "@/icons/expand-height.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type Text from "@/models/Text";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Animation } from "@/models/Tile";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "@/utils/reactivity";

const ALIGN_ICON = {
  TOP: <VerticalAlignTopIcon aria-hidden="true" slot="icon" />,
  CENTER: <VerticalAlignCenterIcon aria-hidden="true" slot="icon" />,
  BOTTOM: <VerticalAlignBottomIcon aria-hidden="true" slot="icon" />,
} as const;

const ANIMATION_ICON = {
  FADE: <FadeIcon aria-hidden="true" slot="icon" />,
  SLIDE: <SlideIcon aria-hidden="true" slot="icon" />,
  GROW: <GrowIcon aria-hidden="true" slot="icon" />,
  SHRINK: <ShrinkIcon aria-hidden="true" slot="icon" />,
} as const;

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

    Editor.current
      .positionTile({
        id,
        block: !block.value,
        height,
      })
      .catch(handleError);
  }

  return (
    <floating-toolbar
      className="bottom-left"
      aria-label="Text tile toolbar"
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
                {align.derive((value) => ALIGN_ICON[value])}

                <swatch-item
                  value="TOP"
                  data-tooltip="Top"
                  data-tooltip-position="right"
                >
                  <VerticalAlignTopIcon aria-hidden="true" />
                </swatch-item>
                <swatch-item
                  value="CENTER"
                  data-tooltip="Center"
                  data-tooltip-position="right"
                >
                  <VerticalAlignCenterIcon aria-hidden="true" />
                </swatch-item>
                <swatch-item
                  value="BOTTOM"
                  data-tooltip="Bottom"
                  data-tooltip-position="right"
                >
                  <VerticalAlignBottomIcon aria-hidden="true" />
                </swatch-item>
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
            {animation.derive((value) =>
              value ? (
                ANIMATION_ICON[value]
              ) : (
                <AnimationIcon aria-hidden="true" slot="icon" />
              ),
            )}

            <swatch-item value="FADE" data-tooltip="Fade in">
              <FadeIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="SLIDE" data-tooltip="Slide">
              <SlideIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="GROW" data-tooltip="Grow">
              <GrowIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="SHRINK" data-tooltip="Shrink">
              <ShrinkIcon aria-hidden="true" />
            </swatch-item>
          </swatch-select>
        </li>
      </ul>

      <ul role="group" aria-label="More tools">
        <li role="presentation">
          <ToolbarButton
            label="Delete"
            destructive
            on:click={() => text.delete()}
          >
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>
    </floating-toolbar>
  );
}
