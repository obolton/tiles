import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import TileTools from "@/components/toolbars/tiles/TileTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
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
import type ListSelect from "@/elements/list-select/ListSelect";
import type { Layout, Anchor, Dimensions } from "@/types/pages";
import type Section from "@/models/Section";

export interface SectionToolbarProps {
  section: Section;
}

export default function SectionToolbar({ section }: SectionToolbarProps) {
  async function setLayout(event: Event) {
    const layout = (event.currentTarget as ListSelect).value as Layout;
    try {
      viewTransition(() => section.setLayout(layout));
    } catch (error) {
      handleError(error);
    }
  }

  async function setAnchor(event: Event) {
    const anchor = (event.currentTarget as ListSelect).value as Anchor;
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
      data-tooltip-position="bottom"
      aria-label="Section toolbar"
    >
      <toolbar-tab label="Section">
        <ToolbarGroup label="Section tools">
          <list-select
            label="Layout"
            data-tooltip="Layout"
            orientation="vertical"
            align="center"
            value={section.layout}
            showvalue
            on:change={setLayout}
          >
            <ListGroup>
              <ListOption
                icon={<GridLayoutIcon aria-hidden="true" />}
                value="GRID"
              >
                Grid
              </ListOption>
              <ListOption
                icon={<HorizontalLayoutIcon aria-hidden="true" />}
                value="HORIZONTAL"
              >
                Horizontal
              </ListOption>
              <ListOption
                icon={<VerticalLayoutIcon aria-hidden="true" />}
                value="VERTICAL"
              >
                Vertical
              </ListOption>
              <ListOption
                icon={<FreeformLayoutIcon aria-hidden="true" />}
                value="FREEFORM"
              >
                Freeform
              </ListOption>
            </ListGroup>
          </list-select>

          <list-select
            label="Anchor"
            aria-selected={section.anchor}
            data-tooltip="Anchor"
            orientation="vertical"
            align="center"
            value={section.anchor}
            on:change={setAnchor}
          >
            <ListGroup>
              <ListOption
                icon={<AnchorTopIcon aria-hidden="true" />}
                value="TOP"
                label="Top"
              >
                Top
              </ListOption>
              <ListOption
                icon={<AnchorBottomIcon aria-hidden="true" />}
                value="BOTTOM"
                label="Bottom"
              >
                Bottom
              </ListOption>
              <ListOption
                icon={<AnchorLeftIcon aria-hidden="true" />}
                value="LEFT"
                label="Left"
              >
                Left
              </ListOption>
              <ListOption
                icon={<AnchorRightIcon aria-hidden="true" />}
                value="RIGHT"
                label="Right"
              >
                Right
              </ListOption>
            </ListGroup>
          </list-select>

          <list-select
            label="Size"
            data-tooltip="Size"
            orientation="vertical"
            value={section.dimensions}
            showvalue
            on:change={setDimensions}
          >
            <ListGroup>
              <ListOption icon={<SizeIcon aria-hidden="true" />} value="CUSTOM">
                Custom size
              </ListOption>
              <ListOption
                icon={<LandscapeIcon aria-hidden="true" />}
                value="LANDSCAPE"
              >
                Landscape
              </ListOption>
              <ListOption
                icon={<PortraitIcon aria-hidden="true" />}
                value="PORTRAIT"
              >
                Portrait
              </ListOption>
            </ListGroup>
          </list-select>

          <FillPicker
            id={`${section.id}-background`}
            value={section.background}
            onChange={setBackground}
          />
        </ToolbarGroup>

        <TileTools tile={section} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
