type CustomElementAttributes = {
  key?: string;
  ref?: React.RefObject;
  id?: string;
  class?: string;
  style?: React.CSSProperties;
  tabindex?: string;
  children?: React.ReactNode;
};

declare namespace JSX {
  interface IntrinsicElements {
    "map-view": CustomElementAttributes & {
      movable?: boolean;
      lat: number;
      long: number;
      bounds?: string;
      label?: string;
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
    };
    "swatch-item": CustomElementAttributes & {
      value: string;
    };
    "calendar-month": CustomElementAttributes & {
      date?: string;
    };
    "stack-view": CustomElementAttributes;
    "stack-item": CustomElementAttributes;
    "popover-menu": CustomElementAttributes & {
      anchor: string;
    };
    "pop-out": CustomElementAttributes & {
      expandable?: string;
      origin?: "center" | "top-left";
    };
  }
}
