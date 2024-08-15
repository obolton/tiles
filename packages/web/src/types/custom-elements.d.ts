declare namespace JSX {
  interface IntrinsicElements {
    "map-view": {
      id?: string;
      class?: string;
      movable?: boolean;
      lat: number;
      long: number;
      bounds?: string;
      label?: string;
    };
    "embedded-video": {
      id?: string;
      class?: string;
      src: string;
      imagesrc?: string;
    };
    "profile-image": {
      id?: string;
      class?: string;
      src?: string | null;
      name?: string | null;
    };
    "infinite-scroll": {
      id?: string;
      ref?: React.RefObject;
      children: JSX.Element | JSX.Element[];
    };
    "swatch-select": {
      id?: string;
      class?: string;
      ref?: React.RefObject;
      value?: string;
      children: JSX.Element | JSX.Element[];
    };
    "swatch-item": {
      key?: string;
      id?: string;
      class?: string;
      style?: React.CSSProperties;
      ref?: React.RefObject;
      value: string;
      children?: string | JSX.Element | JSX.Element[];
    };
  }
}
