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
import Section, { type CreateSectionInput } from "@/models/Section";
import type { PlacementInput } from "doc/tiles/base";
import type { TilePlacementInput } from "@/models/TileContainer";

const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

type SectionProperties = Omit<CreateSectionInput, keyof PlacementInput>;

export interface SectionItemsProps {
  /** Resolves where inserted sections go. */
  getPlacement: () => TilePlacementInput;
}

export default function SectionItems({ getPlacement }: SectionItemsProps) {
  function createSection(properties: SectionProperties): Promise<Section> {
    return Section.create(Editor.current.page, { ...getPlacement(), ...properties });
  }

  function insertSection(properties: SectionProperties) {
    createSection(properties).catch(handleError);
  }

  function insertMap() {
    void showModal(PlaceModalLoader, {
      props: {},
      async onConfirm({ place }) {
        const section = await createSection({ layout: "MAP", sizing: "FOUR_THREE" });
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

  return (
    <MenuItemGroup>
      <MenuItem
        icon={<GridLayoutIcon aria-hidden="true" />}
        on:click={() => insertSection({ layout: "GRID", height: 15 })}
      >
        Grid
      </MenuItem>

      <MenuItem
        icon={<HorizontalLayoutIcon aria-hidden="true" />}
        on:click={() => insertSection({ layout: "HORIZONTAL", height: 15 })}
      >
        Horizontal
      </MenuItem>

      <MenuItem
        icon={<VerticalLayoutIcon aria-hidden="true" />}
        on:click={() => insertSection({ layout: "VERTICAL", height: 15 })}
      >
        Vertical
      </MenuItem>

      <MenuItem
        icon={<FreeformLayoutIcon aria-hidden="true" />}
        on:click={() => insertSection({ layout: "FREEFORM", sizing: "FOUR_THREE" })}
      >
        Freeform
      </MenuItem>

      <MenuItem
        icon={<CalendarLayoutIcon aria-hidden="true" />}
        on:click={() => insertSection({ layout: "CALENDAR", sizing: "FOUR_THREE" })}
      >
        Calendar
      </MenuItem>

      <MenuItem icon={<PlaceIcon aria-hidden="true" />} on:click={insertMap}>
        Map
      </MenuItem>
    </MenuItemGroup>
  );
}
