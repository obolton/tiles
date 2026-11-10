import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import SquareIcon from "@/icons/square.svg?jsx";
import FourThreeIcon from "@/icons/4-3.svg?jsx";
import ThreeFourIcon from "@/icons/3-4.svg?jsx";
import SixteenNineIcon from "@/icons/16-9.svg?jsx";
import NineSixteenIcon from "@/icons/9-16.svg?jsx";
import SizeIcon from "@/icons/size.svg?jsx";
import type { Sizing } from "doc/types/enums";
import type { Reactive } from "carillon";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface AspectRatioSelectProps {
  value: Reactive<Sizing>;
  onChange: (sizing: Sizing) => void;
  showAuto?: boolean;
}

export default function AspectRatioSelect({
  value,
  onChange,
  showAuto = false,
}: AspectRatioSelectProps) {
  function handleChange(event: Event) {
    onChange((event.currentTarget as ListSelect).value as Sizing);
  }

  return (
    <list-select label="Aspect ratio" value={value} showvalue on:change={handleChange}>
      <SizeIcon slot="default-icon" aria-hidden="true" />
      <ListGroup>
        <ListOption icon={<SizeIcon aria-hidden="true" />} value="CUSTOM">
          Custom
        </ListOption>
        {showAuto && <ListOption value="AUTO">Auto</ListOption>}
        <ListOption icon={<SixteenNineIcon aria-hidden="true" />} value="LANDSCAPE">
          16:9
        </ListOption>
        <ListOption icon={<NineSixteenIcon aria-hidden="true" />} value="PORTRAIT">
          9:16
        </ListOption>
        <ListOption icon={<SquareIcon aria-hidden="true" />} value="SQUARE">
          Square
        </ListOption>
        <ListOption icon={<FourThreeIcon aria-hidden="true" />} value="FOUR_THREE">
          4:3
        </ListOption>
        <ListOption icon={<ThreeFourIcon aria-hidden="true" />} value="THREE_FOUR">
          3:4
        </ListOption>
      </ListGroup>
    </list-select>
  );
}
