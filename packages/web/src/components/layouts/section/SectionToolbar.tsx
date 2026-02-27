import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { Layout } from "@/types/pages";
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

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Section toolbar"
    >
      <toolbar-tab name="section" label="Section">
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
        </ToolbarGroup>

        <TileTools tile={section} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={section} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
