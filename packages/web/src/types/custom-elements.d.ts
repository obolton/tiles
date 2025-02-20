import type { ResizeItemAttributes } from "@/elements/resize/ResizeItem";
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
import type { MapViewAttributes } from "@/elements/maps/MapView";
import type { MapMarkerAttributes } from "@/elements/maps/MapMarker";
import type { MapLegendItemAttributes } from "@/elements/maps/MapLegendItem";

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
      "map-view": CustomElementAttributes & MapViewAttributes;
      "map-marker": CustomElementAttributes & MapMarkerAttributes;
      "map-legend-item": CustomElementAttributes & MapLegendItemAttributes;
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
