import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import { showModal } from "@/utils/modals";
import type Editor from "@/editor/Editor";
import type MapView from "@/elements/maps/MapView";
import type { MapProperties } from "@/types/tiles";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapToolbarProps {
  editor: Editor;
  id: string;
  places: MapProperties["places"];
  getMapView: () => MapView;
  anchorName: string;
}

export default function MapToolbar({
  editor,
  id,
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
        const result = await editor.addPlaces({ id, places: [place] });
        places.value = result.places;
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
      <ToolbarButton label="Add place" on:click={addPlace}>
        <AddPlaceIcon aria-hidden="true" />
      </ToolbarButton>
    </floating-toolbar>
  );
}
