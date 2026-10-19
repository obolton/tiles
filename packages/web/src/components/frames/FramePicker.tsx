import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import FrameIcon from "@/icons/frame.svg?jsx";
import { reactive } from "reactivity";
import { parseParentId } from "@/models/parentId";
import styles from "./FramePicker.module.css";
import type Tile from "@/models/Tile";
import type { FrameStyle } from "@/models/Tile";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface FramePickerProps {
  tile: Tile;
  onChange: (frame: FrameStyle | null) => void;
}

const FULL_BLEED_LAYOUTS = ["VERTICAL", "HORIZONTAL"];

const DEFAULT_CORNER_RADIUS = 12;

const CORNER_RADIUS_PRESETS = [
  { value: 0, label: "Sharp", preview: 0 },
  { value: 4, label: "Subtle", preview: 3 },
  { value: DEFAULT_CORNER_RADIUS, label: "Rounded", preview: 7 },
  { value: 24, label: "Soft", preview: 12 },
  { value: 48, label: "Round", preview: 16 },
];

export default function FramePicker({ tile, onChange }: FramePickerProps) {
  const { frame, cornerRadius, page } = tile;

  function handleFrameChange(event: Event) {
    const selected = (event.currentTarget as ListSelect).value;
    onChange(selected === "" ? null : (selected as FrameStyle));
  }

  function handleRadiusChange(event: Event) {
    const element = event.target as HTMLInputElement;
    const value = parseInt(element.value, 10);
    tile.cornerRadius.value = value === DEFAULT_CORNER_RADIUS ? null : value;
  }

  const parent = parseParentId(tile.parentId.value);
  const section = parent.type === "section" ? page.getSection(parent.sectionId) : null;
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
      on:change={handleFrameChange}
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

      <fieldset
        slot="footer"
        className={styles.radii}
        role="radiogroup"
        aria-label="Corners"
        on:change={handleRadiusChange}
      >
        {CORNER_RADIUS_PRESETS.map(({ value, label, preview }) => (
          <input
            type="radio"
            name="corner-radius"
            classList={{ floating: true, small: true, [styles.corner]: true }}
            value={value.toString()}
            aria-label={label}
            style={{ "--preview": `${preview}px` }}
            checked={cornerRadius.derive((r) => (r ?? DEFAULT_CORNER_RADIUS) === value)}
          />
        ))}
      </fieldset>
    </list-select>
  );
}
