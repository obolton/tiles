import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { showModal } from "@/utils/modals";
import Editor from "@/editor/Editor";
import type MapView from "@/elements/maps/MapView";
import type { MapProperties } from "@/types/tiles";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapToolbarProps {
  id: string;
  placementId: MapProperties["placementId"];
  places: MapProperties["places"];
  getMapView: () => MapView;
  anchorName: string;
}

export default function MapToolbar({
  id,
  placementId,
  places,
  getMapView,
  anchorName,
}: MapToolbarProps) {
  function addPlace() {
    showModal(PlaceModalLoader, {
      props: {
        boundingBox: getMapView().getBoundingBox(),
      },
      async onConfirm({ place }) {
        const result = await Editor.current.addPlaces({ id, places: [place] });
        places.value = result.places;
      },
    });
  }

  function deleteTile() {
    Editor.current.deleteTiles([placementId]);
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
          <ToolbarButton label="Delete" destructive on:click={deleteTile}>
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>
    </floating-toolbar>
  );
}
