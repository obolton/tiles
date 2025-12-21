import TileTools from "@/components/toolbars/tiles/TileTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import MenuItem from "@/components/buttons/MenuItem";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import { showModal } from "@/utils/modals";
import type Map from "@/models/Map";
import type MapView from "@/elements/maps/MapView";
import type { MapStyle } from "api/types/tiles";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapToolbarProps {
  map: Map;
  getMapView: () => MapView;
}

export default function MapToolbar({ map, getMapView }: MapToolbarProps) {
  function addPlace() {
    showModal(PlaceModalLoader, {
      props: {
        boundingBox: getMapView().getBoundingBox(),
      },
      async onConfirm({ place }) {
        return map.addPlaces([place]);
      },
    });
  }

  function changeMapStyle(event: Event) {
    const style = (event.currentTarget as SwatchSelect).value as MapStyle;
    map.updateStyle(style);
  }

  return (
    <floating-toolbar
      className="primary"
      aria-label="Map toolbar"
      data-tooltip-position="top"
    >
      <toolbar-tab label="Map">
        <ToolbarGroup label="Map tools">
          <ToolbarButton on:click={addPlace}>
            <AddPlaceIcon aria-hidden="true" />
            Add a place
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Map style">
          <swatch-select
            aria-label="Map style"
            data-tooltip="Map style"
            orientation="vertical"
            align="center"
            showvalue
            value={map.style}
            on:change={changeMapStyle}
          >
            <PlaceIcon aria-hidden="true" slot="default-icon" />
            <ul className="menuitemgroup" role="group">
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  value="DEFAULT"
                  data-label="Default"
                >
                  Default
                </MenuItem>
              </li>
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  value="SATELLITE"
                  data-label="Satellite"
                >
                  Satellite
                </MenuItem>
              </li>
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  value="WATERCOLOR"
                  data-label="Watercolor"
                >
                  Watercolor
                </MenuItem>
              </li>
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  value="MONOCHROME"
                  data-label="Black and white"
                >
                  Black and white
                </MenuItem>
              </li>
            </ul>
          </swatch-select>
        </ToolbarGroup>

        <TileTools tile={map} />
      </toolbar-tab>
    </floating-toolbar>
  );
}
