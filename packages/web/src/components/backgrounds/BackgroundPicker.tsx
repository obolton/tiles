import BackgroundPopover from "./BackgroundPopover";
import BackgroundIcon from "@/icons/background.svg?jsx";
import type { Reactive } from "@/utils/reactivity";
import type { Background } from "./types";

export interface BackgroundPickerProps {
  value?: Reactive<Background>;
  onChange: (value: Background) => void;
}

export default function BackgroundPicker({
  value,
  onChange,
}: BackgroundPickerProps) {
  return (
    <>
      <button
        type="button"
        id="background-picker-button"
        className="floating"
        popovertarget="background-picker"
        aria-label="Background"
        aria-haspopup="menu"
        aria-expanded="false"
        data-tooltip="Background"
      >
        <BackgroundIcon aria-hidden="true" />
      </button>

      <BackgroundPopover
        id="background-picker"
        anchor="background-picker-button"
        align="center"
        value={value}
        onChange={onChange}
      />
    </>
  );
}
