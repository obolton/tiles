import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import AnimationIcon from "@/icons/animation.svg?jsx";
import StopIcon from "@/icons/stop.svg?jsx";
import FadeIcon from "@/icons/fade.svg?jsx";
import SlideIcon from "@/icons/slide.svg?jsx";
import GrowIcon from "@/icons/grow.svg?jsx";
import ShrinkIcon from "@/icons/shrink.svg?jsx";
import type { Animation } from "@/models/Tile";
import type { Reactive } from "carillon";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface AnimationPickerProps {
  value: Reactive<Animation | null>;
  onChange: (animation: Animation | null) => void;
}

export default function AnimationPicker({ value, onChange }: AnimationPickerProps) {
  function handleChange(event: Event) {
    const selected = (event.currentTarget as ListSelect).value;
    onChange(selected === "" ? null : (selected as Animation));
  }

  return (
    <list-select
      label="Animation"
      orientation="vertical"
      showvalue
      value={value.derive((v) => v ?? "")}
      on:change={handleChange}
    >
      <AnimationIcon aria-hidden="true" slot="default-icon" />
      <ListGroup>
        <ListOption icon={<StopIcon aria-hidden="true" />} value="">
          None
        </ListOption>
      </ListGroup>
      <ListGroup>
        <ListOption icon={<FadeIcon aria-hidden="true" />} value="FADE">
          Fade
        </ListOption>
        <ListOption icon={<SlideIcon aria-hidden="true" />} value="SLIDE">
          Slide
        </ListOption>
        <ListOption icon={<GrowIcon aria-hidden="true" />} value="GROW">
          Grow
        </ListOption>
        <ListOption icon={<ShrinkIcon aria-hidden="true" />} value="SHRINK">
          Shrink
        </ListOption>
      </ListGroup>
    </list-select>
  );
}
