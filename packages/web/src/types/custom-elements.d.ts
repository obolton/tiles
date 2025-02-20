import type { ResizeItemAttributes } from "@/components/resize/ResizeItem";
import type { TabItemAttributes } from "@/elements/tabs/TabItem";
import type { TabPanelAttributes } from "@/elements/tabs/TabPanel";
import type { FilePickerAttributes } from "@/components/forms/FilePicker";
import type { PopoverMenuAttributes } from "@/elements/menu/PopoverMenu";
import type { InfiniteScrollAttributes } from "@/elements/infiniteScroll/InfiniteScroll";

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
          event: import("@/components/maps/MapEvent").default,
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
          event: import("@/components/maps/MapEvent").default,
        ) => void;
      };
      "embedded-video": CustomElementAttributes & {
        src: string;
        imagesrc?: string;
      };
      "infinite-scroll": CustomElementAttributes & InfiniteScrollAttributes;
      "swatch-select": CustomElementAttributes & {
        value?: string;
        direction?: "left" | "right";
        onchange?: (event: globalThis.Event) => void;
        ontoggle?: (event: globalThis.ToggleEvent) => void;
      };
      "swatch-item": CustomElementAttributes & {
        value: string;
      };
      "calendar-month": CustomElementAttributes & {
        date?: string;
      };
      "popover-menu": CustomElementAttributes & PopoverMenuAttributes;
      "pop-out": CustomElementAttributes & {
        expandable?: "expandable";
        ontoggle?: (event: globalThis.ToggleEvent) => void;
        onbeforetoggle?: (event: globalThis.ToggleEvent) => void;
      };
      "stack-view": CustomElementAttributes & {
        expandable?: "expandable";
        ontoggle?: (event: globalThis.ToggleEvent) => void;
        onbeforetoggle?: (event: globalThis.ToggleEvent) => void;
      };
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
