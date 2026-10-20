import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import Text from "@/models/Text";
import PlaceIcon from "@/icons/place.svg?jsx";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import { showModal } from "@/utils/modals";
import type MapView from "@/elements/maps/MapView";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { MapStyle } from "doc/types/enums";
import type Section from "@/models/Section";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface MapTabProps {
  section: Section;
}

export default function MapTab({ section }: MapTabProps) {
  function changeMapStyle(event: Event) {
    const style = (event.currentTarget as ListSelect).value as MapStyle;
    section.mapStyle.value = style;
  }

  function addPlace() {
    const mapView = document.querySelector<MapView>(`map-view[data-section-id="${section.id}"]`);
    const boundingBox = mapView?.getBoundingBox();

    void showModal(PlaceModalLoader, {
      props: { boundingBox },
      async onConfirm({ place }) {
        await Text.create(section.page, {
          parentId: section.id,
          sizing: "AUTO",
          width: 8,
          coordinates: { lat: place.lat, long: place.long },
          content: [
            {
              type: "paragraph",
              children: [{ type: "text", format: 0, text: place.name }],
            },
          ],
        });
      },
    });
  }

  return (
    <toolbar-tab name="map" label="Map">
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

      <ToolbarGroup label="Places">
        <ToolbarButton on:click={addPlace}>
          <AddPlaceIcon aria-hidden="true" />
          Add a place
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
