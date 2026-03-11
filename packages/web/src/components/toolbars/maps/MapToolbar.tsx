import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import DateTab from "@/components/toolbars/tiles/DateTab";
import PlaceTab from "./PlaceTab";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import If from "@/jsx/if";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import { showModal } from "@/utils/modals";
import type Map from "@/models/Map";
import type MapView from "@/elements/maps/MapView";
import type { MapStyle } from "api/types/tiles";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { Reactive } from "@/utils/reactivity";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapToolbarProps {
  map: Map;
  getMapView: () => MapView;
  hasSelection: Reactive<boolean>;
}

export default function MapToolbar({
  map,
  getMapView,
  hasSelection,
}: MapToolbarProps) {
  const selectedTab = hasSelection.derive((selected) =>
    selected ? "place" : null,
  );

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
    const style = (event.currentTarget as ListSelect).value as MapStyle;
    map.updateStyle(style);
  }

  return (
    <floating-toolbar
      className="primary"
      aria-label="Map toolbar"
      data-tooltip-position="bottom"
      selectedtab={selectedTab}
    >
      <toolbar-tab name="map" label="Map">
        <ToolbarGroup label="Map tools">
          <ToolbarButton on:click={addPlace}>
            <AddPlaceIcon aria-hidden="true" />
            Add a place
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Map style">
          <list-select
            label="Map style"
            showvalue
            value={map.style}
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

        <TileTools tile={map} />
      </toolbar-tab>

      <toolbar-tab name="style" label="Style">
        <StyleTools tile={map} />
      </toolbar-tab>

      <If condition={hasSelection}>
        <PlaceTab map={map} getMapView={getMapView} />
      </If>

      <DateTab tile={map} />
    </floating-toolbar>
  );
}
