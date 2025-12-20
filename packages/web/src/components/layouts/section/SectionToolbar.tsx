import MenuItem from "@/components/buttons/MenuItem";
import TileTools from "@/components/toolbars/tiles/TileTools";
import FillPicker from "@/components/fills/FillPicker";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import AnchorTopIcon from "@/icons/anchor-top.svg?jsx";
import AnchorBottomIcon from "@/icons/anchor-bottom.svg?jsx";
import AnchorLeftIcon from "@/icons/anchor-left.svg?jsx";
import AnchorRightIcon from "@/icons/anchor-right.svg?jsx";
import LandscapeIcon from "@/icons/landscape.svg?jsx";
import PortraitIcon from "@/icons/portrait.svg?jsx";
import SizeIcon from "@/icons/size.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import Editor from "@/editor/Editor";
import type { FillUpdate } from "@/components/fills/types";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Layout, Anchor, Dimensions } from "@/types/pages";
import type Section from "@/models/Section";

export interface SectionToolbarProps {
  section: Section;
}

export default function SectionToolbar({ section }: SectionToolbarProps) {
  async function setLayout(event: Event) {
    const layout = (event.currentTarget as SwatchSelect).value as Layout;
    try {
      viewTransition(() => section.setLayout(layout));
    } catch (error) {
      handleError(error);
    }
  }

  async function setAnchor(event: Event) {
    const anchor = (event.currentTarget as SwatchSelect).value as Anchor;
    try {
      viewTransition(() => section.setAnchor(anchor));
    } catch (error) {
      handleError(error);
    }
  }

  function setDimensions(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const dimensions = select.value as Dimensions;
    Editor.current.transitionSections(() => {
      section.setDimensions(dimensions);
    });
  }

  async function setBackground(value: FillUpdate) {
    try {
      await section.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Section toolbar"
    >
      <toolbar-tab label="Section">
        <ul role="group" aria-label="Section tools">
          <li role="presentation">
            <swatch-select
              role="menuitem"
              aria-label="Layout"
              data-tooltip="Layout"
              orientation="vertical"
              align="center"
              value={section.layout}
              on:change={setLayout}
            >
              <ul className="menuitemgroup" role="group">
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<GridLayoutIcon aria-hidden="true" />}
                    value="GRID"
                  >
                    Grid
                  </MenuItem>
                </li>
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<HorizontalLayoutIcon aria-hidden="true" />}
                    value="HORIZONTAL"
                  >
                    Horizontal
                  </MenuItem>
                </li>
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<VerticalLayoutIcon aria-hidden="true" />}
                    value="VERTICAL"
                  >
                    Vertical
                  </MenuItem>
                </li>
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<FreeformLayoutIcon aria-hidden="true" />}
                    value="FREEFORM"
                  >
                    Freeform
                  </MenuItem>
                </li>
              </ul>
            </swatch-select>
          </li>

          <li role="presentation">
            <swatch-select
              role="menuitem"
              aria-label="Anchor"
              aria-selected={section.anchor}
              data-tooltip="Anchor"
              orientation="vertical"
              align="center"
              value={section.anchor}
              on:change={setAnchor}
            >
              <ul className="menuitemgroup" role="group">
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<AnchorTopIcon aria-hidden="true" />}
                    value="TOP"
                    label="Top"
                  >
                    Top
                  </MenuItem>
                </li>

                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<AnchorBottomIcon aria-hidden="true" />}
                    value="BOTTOM"
                    label="Bottom"
                  >
                    Bottom
                  </MenuItem>
                </li>

                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<AnchorLeftIcon aria-hidden="true" />}
                    value="LEFT"
                    label="Left"
                  >
                    Left
                  </MenuItem>
                </li>
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<AnchorRightIcon aria-hidden="true" />}
                    value="RIGHT"
                    label="Right"
                  >
                    Right
                  </MenuItem>
                </li>
              </ul>
            </swatch-select>
          </li>

          <li role="presentation">
            <swatch-select
              role="menuitem"
              aria-label="Size"
              data-tooltip="Size"
              orientation="vertical"
              value={section.dimensions}
              on:change={setDimensions}
            >
              <ul className="menuitemgroup" role="group">
                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<SizeIcon aria-hidden="true" />}
                    value="CUSTOM"
                  >
                    Custom size
                  </MenuItem>
                </li>

                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<LandscapeIcon aria-hidden="true" />}
                    value="LANDSCAPE"
                  >
                    Landscape
                  </MenuItem>
                </li>

                <li role="presentation">
                  <MenuItem
                    classList={{ menuitem: true }}
                    icon={<PortraitIcon aria-hidden="true" />}
                    value="PORTRAIT"
                  >
                    Portrait
                  </MenuItem>
                </li>
              </ul>
            </swatch-select>
          </li>

          <li role="presentation">
            <FillPicker
              id={`${section.id}-background`}
              value={section.background}
              onChange={setBackground}
            />
          </li>
        </ul>

        <TileTools tile={section} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
