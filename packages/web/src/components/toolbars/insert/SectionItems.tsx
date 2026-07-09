import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import PlaceIcon from "@/icons/place.svg?jsx";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import CalendarLayoutIcon from "@/icons/event.svg?jsx";
import { showModal } from "@/utils/modals";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import Section from "@/models/Section";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

function createGrid() {
  Section.create(Editor.current.page, {
    beforeId: null,
    layout: "GRID",
    height: 15,
  }).catch(handleError);
}

function createHorizontal() {
  Section.create(Editor.current.page, {
    beforeId: null,
    layout: "HORIZONTAL",
    height: 15,
  }).catch(handleError);
}

function createVertical() {
  Section.create(Editor.current.page, {
    beforeId: null,
    layout: "VERTICAL",
    height: 15,
  }).catch(handleError);
}

function createFreeform() {
  Section.create(Editor.current.page, {
    beforeId: null,
    layout: "FREEFORM",
    sizing: "FOUR_THREE",
  }).catch(handleError);
}

function createCalendar() {
  Section.create(Editor.current.page, {
    beforeId: null,
    layout: "CALENDAR",
    sizing: "FOUR_THREE",
  }).catch(handleError);
}

function createMap() {
  showModal(PlaceModalLoader, {
    props: {},
    async onConfirm({ place }) {
      const section = await Section.create(Editor.current.page, {
        beforeId: null,
        layout: "MAP",
        sizing: "FOUR_THREE",
      });
      await Text.create(Editor.current.page, {
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

export default function SectionItems() {
  return (
    <MenuItemGroup>
      <MenuItem icon={<GridLayoutIcon aria-hidden="true" />} on:click={createGrid}>
        Grid
      </MenuItem>

      <MenuItem icon={<HorizontalLayoutIcon aria-hidden="true" />} on:click={createHorizontal}>
        Horizontal
      </MenuItem>

      <MenuItem icon={<VerticalLayoutIcon aria-hidden="true" />} on:click={createVertical}>
        Vertical
      </MenuItem>

      <MenuItem icon={<FreeformLayoutIcon aria-hidden="true" />} on:click={createFreeform}>
        Freeform
      </MenuItem>

      <MenuItem icon={<CalendarLayoutIcon aria-hidden="true" />} on:click={createCalendar}>
        Calendar
      </MenuItem>

      <MenuItem icon={<PlaceIcon aria-hidden="true" />} on:click={createMap}>
        Map
      </MenuItem>
    </MenuItemGroup>
  );
}
