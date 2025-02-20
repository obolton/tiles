import type { ResizeItemAttributes } from "./resize/ResizeItem";
import type { TabItemAttributes } from "./tabs/TabItem";
import type { TabPanelAttributes } from "./tabs/TabPanel";
import type { FilePickerAttributes } from "./filePicker/FilePicker";
import type { PopoverMenuAttributes } from "./menu/PopoverMenu";
import type { InfiniteScrollAttributes } from "./infiniteScroll/InfiniteScroll";
import type { EmbeddedVideoAttributes } from "./video/EmbeddedVideo";
import type { SwatchSelectAttributes } from "./swatch/SwatchSelect";
import type { SwatchItemAttributes } from "./swatch/SwatchItem";
import type { PopOutAttributes } from "./popOut/PopOut";
import type { StackViewAttributes } from "./stack/StackView";
import type { CalendarMonthAttributes } from "./calendar/CalendarMonth";
import type { MapViewAttributes } from "./maps/MapView";
import type { MapMarkerAttributes } from "./maps/MapMarker";
import type { MapLegendItemAttributes } from "./maps/MapLegendItem";

type CustomElementAttributes = {
  key?: string;
  ref?: React.RefObject<HTMLElement>;
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
      "tab-item": CustomElementAttributes & TabItemAttributes;
      "tab-panel": CustomElementAttributes & TabPanelAttributes;
      "file-picker": CustomElementAttributes & FilePickerAttributes;
      "toast-container": CustomElementAttributes;
    }
  }
}

export {};
