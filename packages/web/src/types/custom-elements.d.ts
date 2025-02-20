import type { ResizeItemAttributes } from "@/components/resize/ResizeItem";
import type { TabItemAttributes } from "@/elements/tabs/TabItem";
import type { TabPanelAttributes } from "@/elements/tabs/TabPanel";
import type { FilePickerAttributes } from "@/elements/filePicker/FilePicker";
import type { PopoverMenuAttributes } from "@/elements/menu/PopoverMenu";
import type { InfiniteScrollAttributes } from "@/elements/infiniteScroll/InfiniteScroll";
import type { EmbeddedVideoAttributes } from "@/elements/video/EmbeddedVideo";
import type { SwatchSelectAttributes } from "@/elements/swatch/SwatchSelect";
import type { SwatchItemAttributes } from "@/elements/swatch/SwatchItem";
import type { PopOutAttributes } from "@/elements/popOut/PopOut";
import type { StackViewAttributes } from "@/elements/stack/StackView";
import type { CalendarMonthAttributes } from "@/elements/calendar/CalendarMonth";

type CustomElementAttributes = {
  key?: string;
  ref?: React.RefObject;
  id?: string;
  class?: string;
  style?: React.CSSProperties;
  tabindex?: string;
  children?: React.ReactNode;
  slot?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "map-view": CustomElementAttributes & {
        movable?: boolean;
        legend?: boolean;
        ondeletemarker?: (
          event: import("@/elements/maps/MapEvent").default,
        ) => void;
      };
      "map-marker": CustomElementAttributes & {
        editable?: boolean;
        id: string;
        lat: number;
        long: number;
        bounds?: string;
        label?: string;
        onblur: (event: globalThis.FocusEvent) => void;
      };
      "map-legend-item": CustomElementAttributes & {
        marker: string;
        editable?: boolean;
        ondeletemarker?: (
          event: import("@/elements/maps/MapEvent").default,
        ) => void;
      };
      "embedded-video": CustomElementAttributes & EmbeddedVideoAttributes;
      "infinite-scroll": CustomElementAttributes & InfiniteScrollAttributes;
      "swatch-select": CustomElementAttributes & SwatchSelectAttributes;
      "swatch-item": CustomElementAttributes & SwatchItemAttributes;
      "calendar-month": CustomElementAttributes & CalendarMonthAttributes;
      "popover-menu": CustomElementAttributes & PopoverMenuAttributes;
      "pop-out": CustomElementAttributes & PopOutAttributes;
      "stack-view": CustomElementAttributes & StackViewAttributes;
      "carousel-view": CustomElementAttributes;
      "resize-item": CustomElementAttributes & ResizeItemAttributes;
      "tab-bar": CustomElementAttributes;
      "tab-item": TabItemAttributes & CustomElementAttributes;
      "tab-panel": TabPanelAttributes & CustomElementAttributes;
      "file-picker": FilePickerAttributes & CustomElementAttributes;
      "toast-container": CustomElementAttributes;
    }
  }
}

export {};
