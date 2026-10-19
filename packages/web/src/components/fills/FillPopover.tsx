import ColorPanel from "./ColorPanel";
import ImagePanel from "./ImagePanel";
import GenerateImagePanel from "./GenerateImagePanel";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import EmptyIcon from "@/icons/empty.svg?jsx";
import styles from "./FillPopover.module.css";
import type { Reactive } from "reactivity";
import type { ThemeColor } from "@/components/colors/ColorPalette";
import type { Fill } from "./types";
import type { JSX } from "@/jsx/jsx";

export interface FillPopoverProps extends JSX.Attributes<"anchored-popover"> {
  id: string;
  themeColors?: Reactive<ThemeColor[]>;
  value: Reactive<Fill | null>;
  onChange: (value: Fill | null) => void;
  allowImage?: boolean;
}

export default function FillPopover({
  id,
  themeColors,
  value,
  onChange,
  allowImage = true,
  ...props
}: FillPopoverProps) {
  return (
    <anchored-popover {...props} id={id} className={styles.popover}>
      <tab-bar>
        <tab-item id={`${id}-color-tab`} for={`${id}-color-tab-panel`} selected>
          <SolidColorIcon aria-hidden="true" />
          Color
        </tab-item>

        {allowImage && (
          <tab-item id={`${id}-image-tab`} for={`${id}-image-tab-panel`}>
            <ImageIcon aria-hidden="true" />
            Image
          </tab-item>
        )}

        {allowImage && (
          <tab-item id={`${id}-generate-tab`} for={`${id}-generate-tab-panel`}>
            <AIIcon aria-hidden="true" />
            Generate
          </tab-item>
        )}

        <tab-item id={`${id}-none-tab`} on:click={() => onChange(null)}>
          <EmptyIcon aria-hidden="true" />
          None
        </tab-item>
      </tab-bar>

      <tab-panel id={`${id}-color-tab-panel`} open>
        <ColorPanel
          themeColors={themeColors}
          value={value.derive((fill) =>
            fill?.type === "color" || fill?.type === "gradient" ? fill : null,
          )}
          onChange={onChange}
        />
      </tab-panel>

      {allowImage && (
        <tab-panel id={`${id}-image-tab-panel`}>
          <ImagePanel onChange={onChange} />
        </tab-panel>
      )}

      {allowImage && (
        <tab-panel id={`${id}-generate-tab-panel`}>
          <GenerateImagePanel onChange={onChange} />
        </tab-panel>
      )}
    </anchored-popover>
  );
}
