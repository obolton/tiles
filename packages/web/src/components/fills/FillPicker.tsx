import ToolbarButton from "@/components/buttons/ToolbarButton";
import FillPopover from "./FillPopover";
import BackgroundIcon from "@/icons/background.svg?jsx";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import { toCSSColor } from "@/utils/color";
import { getBackgroundStyle } from "@/utils/backgrounds";
import styles from "./FillPicker.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { Fill, FillUpdate } from "./types";

export interface FillPickerProps {
  id: string;
  label?: string;
  value: Reactive<Fill | null>;
  onChange: (value: FillUpdate) => void;
  allowImage?: boolean;
}

export default function FillPicker({
  id,
  label,
  value,
  onChange,
  allowImage,
}: FillPickerProps) {
  return (
    <>
      <ToolbarButton
        id={id}
        label={label ?? "Background"}
        popovertarget={`${id}-popover`}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-pressed={value}
      >
        {value ? (
          value.derive((fill) => {
            if (!fill) {
              return <BackgroundIcon aria-hidden="true" />;
            }
            if (fill.type === "color") {
              return (
                <SolidColorIcon
                  style={{ fill: toCSSColor(fill.color) }}
                  aria-hidden="true"
                />
              );
            }
            if (fill.type === "gradient") {
              return (
                <span
                  classList={{ [styles.gradient]: true, icon: true }}
                  style={getBackgroundStyle(fill)}
                  aria-hidden="true"
                />
              );
            }
            if (fill.type === "image") {
              return <ImageIcon aria-hidden="true" />;
            }
            return <BackgroundIcon aria-hidden="true" />;
          })
        ) : (
          <BackgroundIcon aria-hidden="true" />
        )}
        {label}
      </ToolbarButton>

      <FillPopover
        id={`${id}-popover`}
        value={value}
        onChange={onChange}
        allowImage={allowImage}
      />
    </>
  );
}
