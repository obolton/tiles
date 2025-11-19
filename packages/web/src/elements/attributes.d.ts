import type { JSX } from "@/jsx/jsx";
import type { default as PageItem, PageItemAttributes } from "./item/PageItem";
import type { default as TabItem, TabItemAttributes } from "./tabs/TabItem";
import type { default as TabPanel, TabPanelAttributes } from "./tabs/TabPanel";
import type {
  default as FilePicker,
  FilePickerAttributes,
} from "./file-picker/FilePicker";
import type { default as PopoverMenu, PopoverMenuAttributes } from "./menu/PopoverMenu";
import type { default as InfiniteScroll } from "./infinite-scroll/InfiniteScroll";
import type {
  default as EmbeddedVideo,
  EmbeddedVideoAttributes,
} from "./video/EmbeddedVideo";
import type {
  default as SwatchSelect,
  SwatchSelectAttributes,
} from "./swatch/SwatchSelect";
import type { default as PopOut, PopOutAttributes } from "./pop-out/PopOut";
import type { default as StackView, StackViewAttributes } from "./stack/StackView";
import type {
  default as CalendarMonth,
  CalendarMonthAttributes,
} from "./calendar/CalendarMonth";
import type { default as MapView, MapViewAttributes } from "./maps/MapView";
import type { default as MapMarker, MapMarkerAttributes } from "./maps/MapMarker";
import type {
  default as MapLegendItem,
  MapLegendItemAttributes,
} from "./maps/MapLegendItem";
import type {
  default as TableOfContents,
  TableOfContentsAttributes,
} from "./table-of-contents/TableOfContents";
import type { default as FloatingToolbar } from "./floating-toolbar/FloatingToolbar";
import type { default as TableView, TableViewAttributes } from "./table/TableView";
import type { default as SwipeView, SwipeViewAttributes } from "./swipe/SwipeView";
import type { default as ThemeSelector, ThemeSelectorAttributes } from "./themes/ThemeSelector";
import type { default as ScrollView } from "./scroll-view/ScrollView";
import type { default as TabBar } from "./tabs/TabBar";
import type { default as ToastContainer } from "./toasts/ToastContainer";

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
      "infinite-scroll": CustomElementAttributes<InfiniteScroll>;
      "swatch-select": CustomElementAttributes<
        SwatchSelect,
        SwatchSelectAttributes
      >;
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
      "scroll-view": CustomElementAttributes<ScrollView>;
      "page-item": CustomElementAttributes<PageItem, PageItemAttributes>;
      "tab-bar": CustomElementAttributes<TabBar>;
      "tab-item": CustomElementAttributes<TabItem, TabItemAttributes>;
      "tab-panel": CustomElementAttributes<TabPanel, TabPanelAttributes>;
      "file-picker": CustomElementAttributes<FilePicker, FilePickerAttributes>;
      "toast-container": CustomElementAttributes<ToastContainer>;
      "table-of-contents": CustomElementAttributes<
        TableOfContents,
        TableOfContentsAttributes
      >;
      "floating-toolbar": CustomElementAttributes<FloatingToolbar>;
      "table-view": CustomElementAttributes<TableView, TableViewAttributes>;
      "swipe-view": CustomElementAttributes<SwipeView, SwipeViewAttributes>;
      "theme-selector": CustomElementAttributes<
        ThemeSelector,
        ThemeSelectorAttributes
      >;
    }
  }
}

export {};
