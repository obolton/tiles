import ToolbarButton from "@/components/buttons/ToolbarButton";
import FillPopover from "./FillPopover";
import BackgroundIcon from "@/icons/background.svg?jsx";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import { toCSSColor } from "@/utils/color";
import { getBackgroundStyle } from "@/utils/backgrounds";
import styles from "./FillPicker.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { ThemeColor } from "@/components/colors/ColorPalette";
import type { Fill } from "./types";
import type { ToolbarButtonProps } from "@/components/buttons/ToolbarButton";

export interface FillPickerProps extends Omit<
  ToolbarButtonProps,
  "children" | "value"
> {
  themeColors?: Reactive<ThemeColor[]>;
  value: Reactive<Fill | null>;
  onChange: (value: Fill | null) => void;
  allowImage?: boolean;
}

export default function FillPicker({
  id,
  label,
  themeColors,
  value,
  onChange,
  allowImage,
  ...props
}: FillPickerProps) {
  return (
    <>
      <ToolbarButton
        {...props}
        id={id}
        label={label ?? "Background"}
        popovertarget={`${id}-popover`}
        aria-haspopup="menu"
        aria-expanded="false"
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
        themeColors={themeColors}
        value={value}
        onChange={onChange}
        allowImage={allowImage}
      />
    </>
  );
}
