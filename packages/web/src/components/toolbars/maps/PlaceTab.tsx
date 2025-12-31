import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import WriteIcon from "@/icons/write.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import type MapView from "@/elements/maps/MapView";
import type Map from "@/models/Map";

export interface PlaceTabProps {
  map: Map;
  getMapView: () => MapView;
}

export default function PlaceTab({ map, getMapView }: PlaceTabProps) {
  function renamePlace() {
    const selectedMarkers = getMapView().selectedMarkers;
    if (selectedMarkers.length === 1) {
      selectedMarkers[0]?.editLabel();
    }
  }

  function deletePlaces() {
    const mapView = getMapView();
    const selectedMarkers = mapView.selectedMarkers;
    for (const marker of selectedMarkers) {
      map.removePlace(marker.id).catch(handleError);
    }
    mapView.clearSelection();
  }

  return (
    <toolbar-tab name="place" label="Place">
      <ToolbarGroup label="Place tools">
        <ToolbarButton label="Rename" on:click={renamePlace}>
          <WriteIcon aria-hidden="true" />
          Rename
        </ToolbarButton>
        <ToolbarButton label="Delete" destructive on:click={deletePlaces}>
          <TrashIcon aria-hidden="true" />
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
