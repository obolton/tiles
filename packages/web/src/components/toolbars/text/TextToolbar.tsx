import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import ExpandHeightIcon from "@/icons/expand-height.svg?jsx";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";
import type { Background } from "@/components/backgrounds/types";
import type { TextProperties } from "@/types/tiles";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";

const ALIGN_ICON = {
  TOP: <VerticalAlignTopIcon aria-hidden="true" slot="icon" />,
  CENTER: <VerticalAlignCenterIcon aria-hidden="true" slot="icon" />,
  BOTTOM: <VerticalAlignBottomIcon aria-hidden="true" slot="icon" />,
} as const;

export interface TextToolbarProps {
  editor: Editor;
  id: TextProperties["id"];
  placementId: TextProperties["placementId"];
  background: TextProperties["background"];
  block: TextProperties["block"];
  align: TextProperties["align"];
  anchorName: string;
}

export default function TextToolbar({
  editor,
  id,
  placementId,
  background,
  block,
  align,
  anchorName,
}: TextToolbarProps) {
  async function setBackground(value: Background) {
    try {
      const { background: newBackground } = await editor.updateText({
        id,
        background: value,
      });
      viewTransition(() => (background.value = newBackground));
    } catch (error) {
      handleError(error);
    }
  }

  async function setVerticalAlignment(event: Event) {
    try {
      const value = (event.currentTarget as SwatchSelect).value as
        | "TOP"
        | "CENTER"
        | "BOTTOM";
      align.value = value;
      await editor.updateText({
        id,
        align: value,
      });
    } catch (error) {
      handleError(error);
    }
  }

  function toggleBlock() {
    editor
      .positionTile({
        id: placementId,
        block: !block.value,
      })
      .catch(handleError);
  }

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      data-tooltip-position="right"
      aria-label="Toolbar"
    >
      <ul role="group" aria-label="Layout">
        <li role="presentation">
          <BackgroundPicker value={background} onChange={setBackground} />
        </li>

        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
            aria-label="Size to fit contents"
            data-tooltip="Size to fit contents"
            aria-pressed={block.derive((value) => (value ? "true" : "false"))}
            on:click={toggleBlock}
          >
            <ExpandHeightIcon aria-hidden="true" />
          </button>
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
                on:change={setVerticalAlignment}
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
    </floating-toolbar>
  );
}
