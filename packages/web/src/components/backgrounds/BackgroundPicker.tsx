import ToolbarButton from "@/components/buttons/ToolbarButton";
import BackgroundPopover from "./BackgroundPopover";
import BackgroundIcon from "@/icons/background.svg?jsx";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import { toCSSColor } from "@/utils/color";
import { getBackgroundStyle } from "@/utils/backgrounds";
import type { Reactive } from "@/utils/reactivity";
import type { Background, BackgroundUpdate } from "./types";
import styles from "./BackgroundPicker.module.css";

export interface BackgroundPickerProps {
  id: string;
  value: Reactive<Background | null>;
  onChange: (value: BackgroundUpdate) => void;
}

export default function BackgroundPicker({
  id,
  value,
  onChange,
}: BackgroundPickerProps) {
  return (
    <>
      <ToolbarButton
        id={id}
        label="Background"
        popovertarget={`${id}-popover`}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-pressed={value}
      >
        {value ? (
          value.derive((background) => {
            if (!background) {
              return <BackgroundIcon aria-hidden="true" />;
            }
            if (background.type === "color") {
              return (
                <SolidColorIcon
                  style={{ fill: toCSSColor(background.color) }}
                  aria-hidden="true"
                />
              );
            }
            if (background.type === "gradient") {
              return (
                <span
                  classList={[styles.gradient, "icon"]}
                  style={getBackgroundStyle(background)}
                  aria-hidden="true"
                />
              );
            }
            if (background.type === "image") {
              return <ImageIcon aria-hidden="true" />;
            }
            return <BackgroundIcon aria-hidden="true" />;
          })
        ) : (
          <BackgroundIcon aria-hidden="true" />
        )}
      </ToolbarButton>

      <BackgroundPopover
        id={`${id}-popover`}
        anchor={id}
        value={value}
        onChange={onChange}
      />
    </>
  );
}
