import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { showModal } from "@/utils/modals";
import type Map from "@/items/Map";
import type MapView from "@/elements/maps/MapView";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapToolbarProps {
  map: Map;
  getMapView: () => MapView;
  anchorName: string;
}

export default function MapToolbar({
  map,
  getMapView,
  anchorName,
}: MapToolbarProps) {
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
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      aria-label="Map toolbar"
      data-tooltip-position="left"
    >
      <ul role="group" aria-label="Map tools">
        <li role="presentation">
          <ToolbarButton label="Add place" on:click={addPlace}>
            <AddPlaceIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>

      <ul role="group" aria-label="More tools">
        <li role="presentation">
          <ToolbarButton
            label="Delete"
            destructive
            on:click={() => map.delete()}
          >
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>
    </floating-toolbar>
  );
}
