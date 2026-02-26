import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FrameIcon from "@/icons/frame.svg?jsx";
import { reactive } from "@/utils/reactivity";
import type Tile from "@/models/Tile";
import type { FrameStyle } from "@/models/Tile";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface FramePickerProps {
  tile: Tile;
  onChange: (frame: FrameStyle | null) => void;
}

const FULL_BLEED_LAYOUTS = ["VERTICAL", "HORIZONTAL"];

export default function FramePicker({ tile, onChange }: FramePickerProps) {
  const { frame, page } = tile;

  function handleChange(event: Event) {
    const selected = (event.currentTarget as ListSelect).value;
    onChange(selected === "" ? null : (selected as FrameStyle));
  }

  const section = tile.sectionId ? page.getSection(tile.sectionId) : null;
  const fullBleedDisabled = section
    ? section.layout.derive((layout) => !FULL_BLEED_LAYOUTS.includes(layout))
    : reactive(false);

  return (
    <list-select
      label="Frame"
      data-tooltip="Frame"
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      value={frame.derive((v) => v ?? "")}
      on:change={handleChange}
    >
      <FrameIcon aria-hidden="true" slot="default-icon" />

      <ListGroup>
        <ListOption value="">None</ListOption>
      </ListGroup>

      <ListGroup>
        <ListOption value="OUTLINED">Outlined</ListOption>
        <ListOption value="SUBTLE">Subtle</ListOption>
        <ListOption value="CARD">Card</ListOption>
        <ListOption value="RAISED">Raised</ListOption>
        <ListOption value="FRAMED">Framed</ListOption>
      </ListGroup>

      <ListGroup>
        <ListOption value="FULL_BLEED" aria-disabled={fullBleedDisabled}>
          Full bleed
        </ListOption>
      </ListGroup>
    </list-select>
  );
}
