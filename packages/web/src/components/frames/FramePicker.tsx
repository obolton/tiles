import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FrameIcon from "@/icons/frame.svg?jsx";
import type { FrameStyle } from "@/models/Tile";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface FramePickerProps {
  value: Reactive<FrameStyle | null>;
  onChange: (frame: FrameStyle | null) => void;
}

export default function FramePicker({ value, onChange }: FramePickerProps) {
  function handleChange(event: Event) {
    const selected = (event.currentTarget as ListSelect).value;
    onChange(selected === "" ? null : (selected as FrameStyle));
  }

  return (
    <list-select
      label="Frame"
      data-tooltip="Frame"
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      value={value.derive((v) => v ?? "")}
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
    </list-select>
  );
}
