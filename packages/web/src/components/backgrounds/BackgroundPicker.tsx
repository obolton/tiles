import BackgroundPopover from "./BackgroundPopover";
import BackgroundIcon from "@/icons/background.svg?jsx";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import { toCSSColor } from "@/utils/color";
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
        aria-pressed={value?.derive((value) => (value ? "true" : "false"))}
        data-tooltip="Background"
      >
        {value ? (
          value.derive((background) => {
            if (!background) {
              return <BackgroundIcon aria-hidden="true" />;
            }
            if ("color" in background) {
              return (
                <SolidColorIcon
                  style={{ fill: toCSSColor(background.color) }}
                  aria-hidden="true"
                />
              );
            }
            if ("imageUrl" in background) {
              return <ImageIcon aria-hidden="true" />;
            }
            return <BackgroundIcon aria-hidden="true" />;
          })
        ) : (
          <BackgroundIcon aria-hidden="true" />
        )}
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
