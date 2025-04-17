import type PageItem, { PageItemAttributes } from "./item/PageItem";
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
import type { TableOfContentsAttributes } from "./tableOfContents/TableOfContents";
import type { DataBindingAttributes } from "./dataBinding/DataBinding";

interface CustomElementAttributes<T extends HTMLElement = unknown>
  extends React.HTMLAttributes<T> {
  key?: string;
  ref?: React.Ref<T>;
  class?: string;
}

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
      "page-item": CustomElementAttributes<PageItem> & PageItemAttributes;
      "tab-bar": CustomElementAttributes;
      "tab-item": CustomElementAttributes & TabItemAttributes;
      "tab-panel": CustomElementAttributes & TabPanelAttributes;
      "file-picker": CustomElementAttributes & FilePickerAttributes;
      "toast-container": CustomElementAttributes;
      "table-of-contents": CustomElementAttributes & TableOfContentsAttributes;
      "data-binding": CustomElementAttributes & DataBindingAttributes;
    }
  }
}

export {};
