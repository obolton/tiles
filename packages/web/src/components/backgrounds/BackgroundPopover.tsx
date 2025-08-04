import ColorPanel from "./ColorPanel";
import ImagePanel from "./ImagePanel";
import GenerateImagePanel from "./GenerateImagePanel";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import AIIcon from "@/icons/ai.svg?jsx";
import EmptyIcon from "@/icons/empty.svg?jsx";
import styles from "./BackgroundPopover.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { Background } from "./types";
import type PopoverMenu from "@/elements/menu/PopoverMenu";
import type { JSX } from "@/jsx/jsx";

export interface BackgroundPopoverProps extends JSX.Attributes<PopoverMenu> {
  value?: Reactive<Background | null>;
  onChange: (value: Background | null) => void;
}

export default function BackgroundPopover({
  value,
  onChange,
  ...props
}: BackgroundPopoverProps) {
  return (
    <popover-menu {...props} className={styles.popover}>
      <tab-bar>
        <tab-item id="color-tab" for="color-tab-panel" selected>
          <SolidColorIcon aria-hidden="true" />
          Color
        </tab-item>

        <tab-item id="image-tab" for="image-tab-panel">
          <ImageIcon aria-hidden="true" />
          Image
        </tab-item>

        <tab-item id="generate-tab" for="generate-tab-panel">
          <AIIcon aria-hidden="true" />
          Generate
        </tab-item>

        <tab-item id="none-tab" on:click={() => onChange(null)}>
          <EmptyIcon aria-hidden="true" />
          None
        </tab-item>
      </tab-bar>

      <tab-panel id="color-tab-panel" open>
        <ColorPanel
          value={value?.derive((v) => (v?.type === "color" ? v : null))}
          onChange={onChange}
        />
      </tab-panel>

      <tab-panel id="image-tab-panel">
        <ImagePanel onChange={onChange} />
      </tab-panel>

      <tab-panel id="generate-tab-panel">
        <GenerateImagePanel onChange={onChange} />
      </tab-panel>
    </popover-menu>
  );
}
