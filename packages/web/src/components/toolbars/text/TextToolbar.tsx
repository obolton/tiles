import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import ExpandHeightIcon from "@/icons/expand-height.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type Text from "@/items/Text";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";

const ALIGN_ICON = {
  TOP: <VerticalAlignTopIcon aria-hidden="true" slot="icon" />,
  CENTER: <VerticalAlignCenterIcon aria-hidden="true" slot="icon" />,
  BOTTOM: <VerticalAlignBottomIcon aria-hidden="true" slot="icon" />,
} as const;

export interface TextToolbarProps {
  text: Text;
  anchorName: string;
}

export default function TextToolbar({ text, anchorName }: TextToolbarProps) {
  const { id, placementId, align, block } = text;

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
        id: placementId,
        block: !block.value,
        height,
      })
      .catch(handleError);
  }

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      aria-label="Text tile toolbar"
      data-tooltip-position="left"
    >
      <ul role="group" aria-label="Layout">
        <li role="presentation">
          <BackgroundPicker
            id={`${text.id}-background`}
            value={text.background}
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
