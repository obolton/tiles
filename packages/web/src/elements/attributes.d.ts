import type { JSX } from "@/jsx/jsx";
import type PageItem, { PageItemAttributes } from "./item/PageItem";
import type TabItem, { TabItemAttributes } from "./tabs/TabItem";
import type TabPanel, { TabPanelAttributes } from "./tabs/TabPanel";
import type FilePicker, { FilePickerAttributes } from "./filePicker/FilePicker";
import type PopoverMenu, { PopoverMenuAttributes } from "./menu/PopoverMenu";
import type InfiniteScroll, {
  InfiniteScrollAttributes,
} from "./infiniteScroll/InfiniteScroll";
import type EmbeddedVideo, {
  EmbeddedVideoAttributes,
} from "./video/EmbeddedVideo";
import type SwatchSelect, {
  SwatchSelectAttributes,
} from "./swatch/SwatchSelect";
import type SwatchItem, { SwatchItemAttributes } from "./swatch/SwatchItem";
import type PopOut, { PopOutAttributes } from "./popOut/PopOut";
import type StackView, { StackViewAttributes } from "./stack/StackView";
import type CalendarMonth, {
  CalendarMonthAttributes,
} from "./calendar/CalendarMonth";
import type MapView, { MapViewAttributes } from "./maps/MapView";
import type MapMarker, { MapMarkerAttributes } from "./maps/MapMarker";
import type MapLegendItem, {
  MapLegendItemAttributes,
} from "./maps/MapLegendItem";
import type TableOfContents, {
  TableOfContentsAttributes,
} from "./tableOfContents/TableOfContents";
import FloatingToolbar from "./floatingToolbar/FloatingToolbar";
import type TableView, { TableViewAttributes } from "./table/TableView";

type CustomElementAttributes<
  T extends HTMLElement,
  Attributes = {},
> = JSX.Attributes<T & Attributes>;

declare module "@/jsx/jsx" {
  namespace JSX {
    interface IntrinsicElements {
      "map-view": CustomElementAttributes<MapView, MapViewAttributes>;
      "map-marker": CustomElementAttributes<MapMarker, MapMarkerAttributes>;
      "map-legend-item": CustomElementAttributes<
        MapLegendItem,
        MapLegendItemAttributes
      >;
      "embedded-video": CustomElementAttributes<
        EmbeddedVideo,
        EmbeddedVideoAttributes
      >;
      "infinite-scroll": CustomElementAttributes<
        InfiniteScroll,
        InfiniteScrollAttributes
      >;
      "swatch-select": CustomElementAttributes<
        SwatchSelect,
        SwatchSelectAttributes
      >;
      "swatch-item": CustomElementAttributes<SwatchItem, SwatchItemAttributes>;
      "calendar-month": CustomElementAttributes<
        CalendarMonth,
        CalendarMonthAttributes
      >;
      "popover-menu": CustomElementAttributes<
        PopoverMenu,
        PopoverMenuAttributes
      >;
      "pop-out": CustomElementAttributes<PopOut, PopOutAttributes>;
      "stack-view": CustomElementAttributes<StackView, StackViewAttributes>;
      "carousel-view": CustomElementAttributes;
      "page-item": CustomElementAttributes<PageItem, PageItemAttributes>;
      "tab-bar": CustomElementAttributes;
      "tab-item": CustomElementAttributes<TabItem, TabItemAttributes>;
      "tab-panel": CustomElementAttributes<TabPanel, TabPanelAttributes>;
      "file-picker": CustomElementAttributes<FilePicker, FilePickerAttributes>;
      "toast-container": CustomElementAttributes;
      "table-of-contents": CustomElementAttributes<
        TableOfContents,
        TableOfContentsAttributes
      >;
      "floating-toolbar": CustomElementAttributes<FloatingToolbar>;
      "table-view": CustomElementAttributes<TableView, TableViewAttributes>;
    }
  }
}

export {};
