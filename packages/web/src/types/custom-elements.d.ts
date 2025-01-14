import type { ResizeItemAttributes } from "@/components/resize/ResizeItem";

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
      "profile-image": CustomElementAttributes & {
        src?: string | null;
        name?: string | null;
      };
      "infinite-scroll": CustomElementAttributes & {
        onloadmore?: (event: globalThis.Event) => void;
      };
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
      "popover-menu": CustomElementAttributes & {
        anchor: string;
      };
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
    }
  }
}

export {};
