import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import { showModal } from "@/utils/modals";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";
import type Editor from "@/editor/Editor";
import type MapView from "@/elements/maps/MapView";
import type { MapProperties } from "@/types/tiles";

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
    showModal<PlaceModalResult>("MAP", {
      boundingBox: getMapView().getBoundingBox(),
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
      data-tooltip-position="top"
    >
      <button
        type="button"
        role="menuitem"
        className="floating"
        aria-label="Add place"
        data-tooltip="Add a place"
        on:click={addPlace}
      >
        <AddPlaceIcon aria-hidden="true" />
      </button>
    </floating-toolbar>
  );
}
