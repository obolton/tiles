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
        legend?: string;
      };
      "map-marker": CustomElementAttributes & {
        id: string;
        lat: number;
        long: number;
        bounds?: string;
        label?: string;
      };
      "map-legend-item": CustomElementAttributes & {
        marker: string;
        delete?: boolean;
      };
      "embedded-video": CustomElementAttributes & {
        src: string;
        imagesrc?: string;
      };
      "profile-image": CustomElementAttributes & {
        src?: string | null;
        name?: string | null;
      };
      "infinite-scroll": CustomElementAttributes;
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
      };
      "stack-view": CustomElementAttributes & {
        expandable?: "expandable";
      };
      "resize-item": CustomElementAttributes & {
        disabled?: "disabled";
      };
    }
  }
}

export {};
