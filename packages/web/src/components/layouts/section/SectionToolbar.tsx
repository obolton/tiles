import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import If from "@/jsx/if";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import CalendarLayoutIcon from "@/icons/event.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { Layout } from "@/types/pages";
import type { MapStyle } from "api/types/tiles";
import type Section from "@/models/Section";

export interface SectionToolbarProps {
  section: Section;
}

export default function SectionToolbar({ section }: SectionToolbarProps) {
  const isMap = section.layout.derive((layout) => layout === "MAP");

  async function setLayout(event: Event) {
    const layout = (event.currentTarget as ListSelect).value as Layout;
    try {
      viewTransition(() => section.setLayout(layout));
    } catch (error) {
      handleError(error);
    }
  }

  function changeMapStyle(event: Event) {
    const style = (event.currentTarget as ListSelect).value as MapStyle;
    section.setMapStyle(style);
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
              <ListOption
                icon={<CalendarLayoutIcon aria-hidden="true" />}
                value="CALENDAR"
              >
                Calendar
              </ListOption>
              <ListOption icon={<PlaceIcon aria-hidden="true" />} value="MAP">
                Map
              </ListOption>
            </ListGroup>
          </list-select>
        </ToolbarGroup>

        <If condition={isMap}>
          <ToolbarGroup label="Map style">
            <list-select
              label="Map style"
              showvalue
              value={section.mapStyle}
              on:change={changeMapStyle}
            >
              <PlaceIcon aria-hidden="true" slot="default-icon" />
              <ListGroup>
                <ListOption value="DEFAULT">Default</ListOption>
                <ListOption value="SATELLITE">Satellite</ListOption>
                <ListOption value="WATERCOLOR">Watercolor</ListOption>
                <ListOption value="MONOCHROME">Black and white</ListOption>
              </ListGroup>
            </list-select>
          </ToolbarGroup>
        </If>

        <TileTools tile={section} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={section} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
