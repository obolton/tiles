import TileTools from "@/components/toolbars/tiles/TileTools";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import { showModal } from "@/utils/modals";
import type Map from "@/models/Map";
import type MapView from "@/elements/maps/MapView";

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

  return (
    <floating-toolbar
      className="primary"
      aria-label="Map toolbar"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="Map tools">
        <li role="presentation">
          <ToolbarButton label="Add place" on:click={addPlace}>
            <AddPlaceIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>

      <TileTools tile={map} />
    </floating-toolbar>
  );
}
